require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const Goods = require('../src/models/Goods');
const Alert = require('../src/models/Alert');
const inventoryService = require('../src/services/inventoryService');

describe('FR-REQ & FR-TRF: Stock Requests, FEFO Transfers & Discrepancies', () => {
  let zone, woreda, kebele;
  let sugar;
  let adminToken, zoneOfficerToken, woredaOfficerToken, storeManagerToken;
  let adminUser;

  beforeEach(async () => {
    // 1. Hierarchy
    zone = await Location.create({ name: 'North Shewa Zone', code: 'ETH-AM-NSZ', type: 'zone' });
    woreda = await Location.create({ name: 'Debre Berhan', code: 'WRD-DB', type: 'woreda', parentId: zone._id });
    kebele = await Location.create({ name: 'Kebele 01', code: 'KEB-01', type: 'kebele', parentId: woreda._id });

    // 2. Good
    sugar = await Goods.create({ name: 'Sugar', category: 'Food Staples', unit: 'kg' });

    // 3. Users
    const pwd = await User.hashPassword('Admin@123456');
    adminUser = await User.create({ fullName: 'Admin', username: 'admin', passwordHash: pwd, role: 'admin', locationId: zone._id });
    const zoneOff = await User.create({ fullName: 'Zone Officer', username: 'zone_officer', passwordHash: pwd, role: 'zone_officer', locationId: zone._id });
    const woredaOff = await User.create({ fullName: 'Woreda Officer', username: 'woreda_officer', passwordHash: pwd, role: 'woreda_officer', locationId: woreda._id });
    const storeMgr = await User.create({ fullName: 'Store Manager', username: 'store_manager', passwordHash: pwd, role: 'store_manager', locationId: zone._id });

    // Get tokens
    const r1 = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'Admin@123456' });
    adminToken = r1.body.data.token;
    const r2 = await request(app).post('/api/v1/auth/login').send({ username: 'zone_officer', password: 'Admin@123456' });
    zoneOfficerToken = r2.body.data.token;
    const r3 = await request(app).post('/api/v1/auth/login').send({ username: 'woreda_officer', password: 'Admin@123456' });
    woredaOfficerToken = r3.body.data.token;
    const r4 = await request(app).post('/api/v1/auth/login').send({ username: 'store_manager', password: 'Admin@123456' });
    storeManagerToken = r4.body.data.token;

    // Stock Zone store with 5000kg sugar
    await inventoryService.receiveStock({
      locationId: zone._id,
      goodsId: sugar._id,
      batchNumber: 'SUG-ZONE-B1',
      quantity: 5000,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      userId: adminUser._id
    });
  });

  test('FR-REQ-01 & FR-REQ-02: Woreda requests from Zone and Zone Officer approves', async () => {
    // 1. Submit request from Woreda
    const reqRes = await request(app)
      .post('/api/v1/stock-requests')
      .set('Authorization', `Bearer ${woredaOfficerToken}`)
      .send({
        fromLocationId: woreda._id,
        items: [{ goodsId: sugar._id, quantityRequested: 1000 }]
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.data.requestNo).toMatch(/^REQ-/);
    expect(reqRes.body.data.toLocationId.toString()).toBe(zone._id.toString());
    const requestId = reqRes.body.data._id;

    // 2. Zone officer approves 800kg partial
    const approveRes = await request(app)
      .post(`/api/v1/stock-requests/${requestId}/decide`)
      .set('Authorization', `Bearer ${zoneOfficerToken}`)
      .send({
        decision: 'approve',
        itemsApproved: [{ goodsId: sugar._id, quantityApproved: 800 }],
        decisionNote: 'Approved 800kg based on current allocation'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');
    expect(approveRes.body.data.items[0].quantityApproved).toBe(800);
  });

  test('FR-TRF-01, FR-TRF-02 & FR-TRF-03: Dispatch transfer and handle discrepancy on arrival', async () => {
    // 1. Dispatch 1000kg sugar from Zone to Woreda
    const dispatchRes = await request(app)
      .post('/api/v1/transfers/dispatch')
      .set('Authorization', `Bearer ${storeManagerToken}`)
      .send({
        fromLocationId: zone._id,
        toLocationId: woreda._id,
        items: [{ goodsId: sugar._id, quantitySent: 1000 }]
      });

    expect(dispatchRes.status).toBe(201);
    expect(dispatchRes.body.data.status).toBe('in_transit');
    const transfer = dispatchRes.body.data;
    expect(transfer.items[0].batchNumber).toBe('SUG-ZONE-B1');

    // 2. Receiver reports only 950kg received (50kg shortage/discrepancy)
    const receiveRes = await request(app)
      .post(`/api/v1/transfers/${transfer._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        receivedItems: [{
          goodsId: sugar._id,
          batchNumber: 'SUG-ZONE-B1',
          quantityReceived: 950
        }],
        discrepancyNote: 'Shortage of 50kg due to torn sacks in transport'
      });

    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.status).toBe('received_with_discrepancy');
    expect(receiveRes.body.data.discrepancyNote).toMatch(/shortage of 50kg/i);
  });
});
