require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const Goods = require('../src/models/Goods');
const QuotaRule = require('../src/models/QuotaRule');
const Beneficiary = require('../src/models/Beneficiary');
const Inventory = require('../src/models/Inventory');
const distributionService = require('../src/services/distributionService');
const inventoryService = require('../src/services/inventoryService');

describe('Essential Goods System — Core Business Rules & Atomic Transactions', () => {
  let adminToken, kebeleToken;
  let zone, woreda, kebele;
  let sugar, oil;
  let adminUser, kebeleOfficerUser;

  beforeEach(async () => {
    // 1. Create hierarchy
    zone = await Location.create({
      name: 'North Shewa Zone',
      code: 'ETH-AM-NSZ',
      type: 'zone'
    });

    woreda = await Location.create({
      name: 'Debre Berhan',
      code: 'WRD-DB',
      type: 'woreda',
      parentId: zone._id
    });

    kebele = await Location.create({
      name: 'Kebele 01',
      code: 'KEB-01',
      type: 'kebele',
      parentId: woreda._id
    });

    // 2. Create Goods
    sugar = await Goods.create({
      name: 'Sugar',
      category: 'Food Staples',
      unit: 'kg'
    });

    oil = await Goods.create({
      name: 'Edible Cooking Oil',
      category: 'Food Staples',
      unit: 'liter'
    });

    // 3. Create Users
    const pwd = await User.hashPassword('Admin@123456');
    adminUser = await User.create({
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: pwd,
      role: 'admin',
      locationId: zone._id
    });

    kebeleOfficerUser = await User.create({
      fullName: 'Kebele Officer',
      username: 'kebele_officer',
      passwordHash: pwd,
      role: 'kebele_officer',
      locationId: kebele._id
    });

    // Generate tokens
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123456' });
    adminToken = adminRes.body.data.token;

    const kebeleRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'kebele_officer', password: 'Admin@123456' });
    kebeleToken = kebeleRes.body.data.token;

    // 4. Create Quota Rule: Sugar = 3kg/person, max 15kg/household
    await QuotaRule.create({
      goodsId: sugar._id,
      quantityPerPerson: 3,
      maxPerHousehold: 15,
      periodType: 'monthly',
      active: true
    });
  });

  test('FR-BEN-02: Should reject duplicate beneficiary ID system-wide', async () => {
    // Register first beneficiary
    const res1 = await request(app)
      .post('/api/v1/beneficiaries')
      .set('Authorization', `Bearer ${kebeleToken}`)
      .send({
        headName: 'Abebe Bikila',
        gender: 'male',
        idType: 'fayda',
        idNumber: 'FAYDA-111222333',
        phone: '0911000000',
        kebeleId: kebele._id,
        familySize: 3
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);

    // Register second beneficiary with the SAME idNumber
    const res2 = await request(app)
      .post('/api/v1/beneficiaries')
      .set('Authorization', `Bearer ${kebeleToken}`)
      .send({
        headName: 'Different Name',
        gender: 'female',
        idType: 'fayda',
        idNumber: 'FAYDA-111222333',
        phone: '0922000000',
        kebeleId: kebele._id,
        familySize: 4
      });

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/duplicate/i);
  });

  test('FR-QTA-02: Quota formula correctly caps at maxPerHousehold', async () => {
    // Household with 7 members: 7 * 3 = 21kg, but max is 15kg!
    const benLarge = await Beneficiary.create({
      headName: 'Large Household',
      gender: 'male',
      idType: 'kebele',
      idNumber: 'KEB-LARGE-01',
      phone: '0911999888',
      kebeleId: kebele._id,
      woredaId: woreda._id,
      familySize: 7,
      status: 'verified',
      registeredBy: kebeleOfficerUser._id
    });

    const quotaInfo = await distributionService.getBeneficiaryQuotaStatus(benLarge._id);
    const sugarQuota = quotaInfo.quotas.find(q => q.goods._id.toString() === sugar._id.toString());

    expect(sugarQuota).toBeDefined();
    expect(sugarQuota.allowed).toBe(15); // Capped at maxPerHousehold of 15kg
    expect(sugarQuota.remaining).toBe(15);
  });

  test('FR-INV-05: FEFO algorithm consumes earliest expiring batch first', async () => {
    const now = new Date();
    const batchNear = new Date(now.getFullYear(), now.getMonth() + 2, 1); // Expires in 2 months
    const batchFar = new Date(now.getFullYear(), now.getMonth() + 6, 1);  // Expires in 6 months

    // Receive batch that expires later first
    await inventoryService.receiveStock({
      locationId: kebele._id,
      goodsId: sugar._id,
      batchNumber: 'BATCH-FAR',
      quantity: 100,
      expiryDate: batchFar,
      userId: adminUser._id
    });

    // Receive batch that expires earlier
    await inventoryService.receiveStock({
      locationId: kebele._id,
      goodsId: sugar._id,
      batchNumber: 'BATCH-NEAR',
      quantity: 50,
      expiryDate: batchNear,
      userId: adminUser._id
    });

    // Deduct 70kg: FEFO must consume all 50kg of BATCH-NEAR first, then 20kg of BATCH-FAR
    const consumed = await inventoryService.deductStockFEFO({
      locationId: kebele._id,
      goodsId: sugar._id,
      quantityRequired: 70,
      userId: adminUser._id
    });

    expect(consumed.length).toBe(2);
    expect(consumed[0].batchNumber).toBe('BATCH-NEAR');
    expect(consumed[0].quantity).toBe(50);
    expect(consumed[1].batchNumber).toBe('BATCH-FAR');
    expect(consumed[1].quantity).toBe(20);

    // Verify remaining stock in DB
    const nearDb = await Inventory.findOne({ batchNumber: 'BATCH-NEAR' });
    const farDb = await Inventory.findOne({ batchNumber: 'BATCH-FAR' });

    expect(nearDb.quantity).toBe(0);
    expect(farDb.quantity).toBe(80);
  });

  test('FR-DST-03 & FR-DST-04: Atomic distribution updates stock, deducts quota, generates receipt', async () => {
    // 1. Stock Kebele store
    await inventoryService.receiveStock({
      locationId: kebele._id,
      goodsId: sugar._id,
      batchNumber: 'SUG-KEB-01',
      quantity: 500,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      userId: adminUser._id
    });

    // 2. Create verified beneficiary (family size 3 -> 3 * 3 = 9kg allowed)
    const ben = await Beneficiary.create({
      headName: 'Alemayehu Tesfaye',
      gender: 'male',
      idType: 'fayda',
      idNumber: 'ETH-FAYDA-555444',
      phone: '0912345678',
      kebeleId: kebele._id,
      woredaId: woreda._id,
      familySize: 3,
      status: 'verified',
      registeredBy: kebeleOfficerUser._id
    });

    // 3. Record distribution of 6kg sugar (within 9kg limit)
    const distRes = await request(app)
      .post('/api/v1/distributions')
      .set('Authorization', `Bearer ${kebeleToken}`)
      .send({
        beneficiaryId: ben._id,
        kebeleId: kebele._id,
        items: [{ goodsId: sugar._id, quantity: 6 }]
      });

    expect(distRes.status).toBe(201);
    expect(distRes.body.success).toBe(true);
    expect(distRes.body.data.receiptNo).toBeDefined();
    expect(distRes.body.data.receiptNo).toMatch(/^RC-KEB01-/);

    // 4. Verify remaining quota is now 3kg
    const quotaInfo = await distributionService.getBeneficiaryQuotaStatus(ben._id);
    const sugarQuota = quotaInfo.quotas.find(q => q.goods._id.toString() === sugar._id.toString());
    expect(sugarQuota.used).toBe(6);
    expect(sugarQuota.remaining).toBe(3);

    // 5. Try distributing 5kg more (which would exceed 9kg total) -> Must be blocked!
    const overDistRes = await request(app)
      .post('/api/v1/distributions')
      .set('Authorization', `Bearer ${kebeleToken}`)
      .send({
        beneficiaryId: ben._id,
        kebeleId: kebele._id,
        items: [{ goodsId: sugar._id, quantity: 5 }]
      });

    expect(overDistRes.status).toBe(400);
    expect(overDistRes.body.success).toBe(false);
    expect(overDistRes.body.message).toMatch(/exceeds monthly quota/i);
  });
});
