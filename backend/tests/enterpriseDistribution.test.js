require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const Goods = require('../src/models/Goods');
const Beneficiary = require('../src/models/Beneficiary');
const CooperativeStore = require('../src/models/CooperativeStore');
const DistributionCycle = require('../src/models/DistributionCycle');
const DistributionTransaction = require('../src/models/DistributionTransaction');
const GotSchedule = require('../src/models/GotSchedule');
const Counter = require('../src/models/Counter');

describe('Enterprise Essential Goods System — North Shewa Zone & Baso Kebele Case Study', () => {
  let adminToken, kebeleToken, storekeeperToken, woredaToken, zoneToken;
  let zone, woreda, basoKebele, otherKebele;
  let oil, sugar;
  let adminUser, kebeleOfficer, storekeeper, woredaOfficer, zoneExpert;
  let basoStore, activeCycle;

  beforeEach(async () => {
    // 1. Administrative Hierarchy
    zone = await Location.create({
      name: 'North Shewa Zone Administration',
      code: 'NSZ',
      type: 'zone'
    });

    woreda = await Location.create({
      name: 'Debre Berhan City Administration',
      code: 'NSZ-W01',
      type: 'woreda',
      parentId: zone._id
    });

    basoKebele = await Location.create({
      name: 'Baso Kebele',
      nameAm: 'ባሶ ቀበሌ',
      code: 'NSZ-W01-K04',
      type: 'kebele',
      parentId: woreda._id,
      gots: ['Got 01 (መሀል ሰፈር)', 'Got 02 (አባይ ማዶ)']
    });

    otherKebele = await Location.create({
      name: 'Kebele 01',
      code: 'NSZ-W01-K01',
      type: 'kebele',
      parentId: woreda._id
    });

    // 2. Commodities with Subsidized Price Ceilings
    oil = await Goods.create({
      name: 'Edible Cooking Oil',
      nameAm: 'የምግብ ዘይት',
      category: 'Subsidized Essential',
      unit: 'liter',
      priceCeiling: 130,
      defaultQuotaPerPerson: 2,
      defaultMaxPerHousehold: 10
    });

    sugar = await Goods.create({
      name: 'Sugar',
      nameAm: 'ስኳር',
      category: 'Subsidized Essential',
      unit: 'kg',
      priceCeiling: 75,
      defaultQuotaPerPerson: 2,
      defaultMaxPerHousehold: 8
    });

    // 3. Actors
    const pwd = await User.hashPassword('Admin@123456');

    adminUser = await User.create({
      fullName: 'ICT Admin',
      username: 'admin',
      passwordHash: pwd,
      role: 'SYSTEM_ADMIN',
      locationId: zone._id
    });

    zoneExpert = await User.create({
      fullName: 'Zone Expert',
      username: 'zone_expert',
      passwordHash: pwd,
      role: 'ZONE_EXPERT',
      locationId: zone._id
    });

    woredaOfficer = await User.create({
      fullName: 'Woreda Officer',
      username: 'woreda_officer',
      passwordHash: pwd,
      role: 'WOREDA_OFFICER',
      locationId: woreda._id
    });

    kebeleOfficer = await User.create({
      fullName: 'Kebele Officer',
      username: 'kebele_officer',
      passwordHash: pwd,
      role: 'KEBELE_OFFICER',
      locationId: basoKebele._id
    });

    storekeeper = await User.create({
      fullName: 'Storekeeper',
      username: 'storekeeper',
      passwordHash: pwd,
      role: 'STOREKEEPER',
      locationId: basoKebele._id
    });

    // 4. Cooperative Store with Simplified Stock Balance Model
    basoStore = await CooperativeStore.create({
      name: 'Baso Consumers Cooperative Store',
      code: 'COOP-NSZ-W01-K04',
      kebeleId: basoKebele._id,
      woredaId: woreda._id,
      storekeeperId: storekeeper._id,
      stocks: [
        {
          goodsId: oil._id,
          goodsName: oil.name,
          unit: oil.unit,
          totalStock: 500
        },
        {
          goodsId: sugar._id,
          goodsName: sugar.name,
          unit: sugar.unit,
          totalStock: 300
        }
      ]
    });

    // 5. Active Distribution Cycle
    activeCycle = await DistributionCycle.create({
      cycleCode: 'CYCLE-2026-11',
      title: 'November 2026 Subsidized Distribution',
      month: '2026-11',
      status: 'active',
      kebeleAllocations: [
        {
          kebeleId: basoKebele._id,
          storeId: basoStore._id,
          goodsId: oil._id,
          goodsName: oil.name,
          unit: oil.unit,
          allocatedQuantity: 500,
          receivedQuantity: 500,
          isReceived: true,
          quotaRule: {
            quantityPerPerson: 2,
            maxPerHousehold: 10,
            unitPrice: 130
          }
        },
        {
          kebeleId: basoKebele._id,
          storeId: basoStore._id,
          goodsId: sugar._id,
          goodsName: sugar.name,
          unit: sugar.unit,
          allocatedQuantity: 300,
          receivedQuantity: 300,
          isReceived: true,
          quotaRule: {
            quantityPerPerson: 2,
            maxPerHousehold: 8,
            unitPrice: 75
          }
        }
      ]
    });

    // Obtain JWT tokens
    const login = async username => {
      const res = await request(app).post('/api/v1/auth/login').send({ username, password: 'Admin@123456' });
      return res.body.data.token;
    };

    adminToken = await login('admin');
    zoneToken = await login('zone_expert');
    woredaToken = await login('woreda_officer');
    kebeleToken = await login('kebele_officer');
    storekeeperToken = await login('storekeeper');
  });

  describe('1. Two-Layer Uniqueness & Global Anti-Duplication Architecture', () => {
    it('generates hierarchical Ration ID format NSZ-W01-K04-000001 and enforces 12-digit Fayda ID', async () => {
      const res = await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({
          headName: 'Abebe Kebede',
          gender: 'male',
          maritalStatus: 'Married',
          idType: 'fayda',
          faydaId: '123456789012',
          phone: '0911223344',
          kebeleId: basoKebele._id,
          got: 'Got 01 (መሀል ሰፈር)',
          familyMembers: [
            {
              name: 'Tirhas Mengesha',
              relationship: 'Spouse',
              faydaOrBirthId: '123456789013',
              age: 30,
              gender: 'female'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.beneficiary.rationCardId).toMatch(/^NSZ-W01-K04-\d{6}$/);
      expect(res.body.data.beneficiary.faydaId).toBe('123456789012');
      expect(res.body.data.beneficiary.familySize).toBe(2);
    });

    it('rejects invalid non-12-digit Fayda IDs', async () => {
      const res = await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({
          headName: 'Tesfaye Alemu',
          gender: 'male',
          idType: 'fayda',
          faydaId: '12345', // Invalid length
          phone: '0911998877',
          kebeleId: basoKebele._id
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('12 numeric digits');
    });

    it('blocks duplicate Household Head across different Kebeles with detailed collision info', async () => {
      // Register in Baso Kebele first
      await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({
          headName: 'Mulugeta Haile',
          gender: 'male',
          faydaId: '555555555555',
          phone: '0911112233',
          kebeleId: basoKebele._id
        });

      // Attempt registration of same Fayda ID in Kebele 01
      const dupRes = await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          headName: 'Mulugeta Haile',
          gender: 'male',
          faydaId: '555555555555',
          phone: '0911112233',
          kebeleId: otherKebele._id
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toContain('already active in Baso Kebele');
    });

    it('cross-checks dependents: blocks registration if a dependent ID is already registered anywhere', async () => {
      // Register household with dependent "Yohannes" having ID 'DEP-999999'
      await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({
          headName: 'Girma Wolde',
          gender: 'male',
          faydaId: '777777777777',
          phone: '0911334455',
          kebeleId: basoKebele._id,
          familyMembers: [
            {
              name: 'Yohannes Girma',
              relationship: 'Child',
              faydaOrBirthId: 'DEP-999999',
              age: 10
            }
          ]
        });

      // In another Kebele, attempt to register "DEP-999999" as a Household Head
      const collHead = await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          headName: 'Yohannes Girma',
          gender: 'male',
          faydaId: 'DEP-999999',
          idType: 'kebele',
          phone: '0911002233',
          kebeleId: otherKebele._id
        });

      expect(collHead.status).toBe(409);
      expect(collHead.body.message).toContain('Duplicate registration blocked');
      expect(collHead.body.message).toContain('Baso Kebele');
    });
  });

  describe('2. Simplified Stock Balance Model & ACID Counter POS Handover', () => {
    let testHousehold;

    beforeEach(async () => {
      testHousehold = await Beneficiary.create({
        rationCardId: 'NSZ-W01-K04-000125',
        faydaId: '123456789012',
        idNumber: '123456789012',
        headName: 'Abebe Kebede',
        gender: 'male',
        maritalStatus: 'Married',
        phone: '0911223344',
        kebeleId: basoKebele._id,
        woredaId: woreda._id,
        familySize: 4,
        status: 'verified',
        registeredBy: kebeleOfficer._id
      });
    });

    it('atomically deducts stock from store simple stock balance and records cash at counter POS', async () => {
      const initialOilStock = basoStore.stocks.find(s => s.goodsId.toString() === oil._id.toString()).totalStock;

      const posRes = await request(app)
        .post('/api/v1/distribution-management/store/pos-handover')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          householdId: testHousehold._id,
          cycleId: activeCycle._id,
          storeId: basoStore._id,
          items: [
            {
              goodsId: oil._id,
              quantity: 8, // 4 familySize * 2 per person = 8 Liters
              unitPrice: 130
            }
          ]
        });

      expect(posRes.status).toBe(201);
      expect(posRes.body.success).toBe(true);
      expect(posRes.body.data.totalCash).toBe(8 * 130);
      expect(posRes.body.data.receiptNo).toMatch(/^POS-NSZ-W01-K04-/);

      // Verify store simplified stock balance decreased atomically
      const updatedStore = await CooperativeStore.findById(basoStore._id);
      const updatedOilStock = updatedStore.stocks.find(s => s.goodsId.toString() === oil._id.toString()).totalStock;
      expect(updatedOilStock).toBe(initialOilStock - 8);
    });

    it('compound unique index prevents double claiming in the same cycle', async () => {
      // First handover
      await request(app)
        .post('/api/v1/distribution-management/store/pos-handover')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          householdId: testHousehold._id,
          cycleId: activeCycle._id,
          storeId: basoStore._id,
          items: [{ goodsId: oil._id, quantity: 4, unitPrice: 130 }]
        });

      // Second handover attempt in the same cycle
      const secondRes = await request(app)
        .post('/api/v1/distribution-management/store/pos-handover')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          householdId: testHousehold._id,
          cycleId: activeCycle._id,
          storeId: basoStore._id,
          items: [{ goodsId: oil._id, quantity: 4, unitPrice: 130 }]
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.message).toContain('ALREADY collected');
    });

    it('rejects handover if requested quantity exceeds store simplified stock balance', async () => {
      const posRes = await request(app)
        .post('/api/v1/distribution-management/store/pos-handover')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          householdId: testHousehold._id,
          cycleId: activeCycle._id,
          storeId: basoStore._id,
          items: [
            {
              goodsId: oil._id,
              quantity: 999999, // Exceeds available stock
              unitPrice: 130
            }
          ]
        });

      expect(posRes.status).toBe(400);
      expect(posRes.body.message).toContain('INSUFFICIENT STORE STOCK');
    });
  });

  describe('3. Public Citizen Portal (Zero Login)', () => {
    it('allows any citizen to view live stock availability and official price ceilings without login', async () => {
      const res = await request(app)
        .get('/api/v1/distribution-management/public/portal?kebeleCode=NSZ-W01-K04');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selectedKebele.code).toBe('NSZ-W01-K04');
      expect(res.body.data.store.name).toBe('Baso Consumers Cooperative Store');
      expect(res.body.data.commodities.length).toBeGreaterThan(0);
      // Official subsidized price ceiling exposed
      expect(res.body.data.commodities.find(c => c.name === 'Edible Cooking Oil').priceCeiling).toBe(130);
    });

    it('allows citizens to verify their Ration ID status with zero login', async () => {
      const household = await Beneficiary.create({
        rationCardId: 'NSZ-W01-K04-000999',
        faydaId: '999888777666',
        idNumber: '999888777666',
        headName: 'Kassahun Bekele',
        gender: 'male',
        phone: '0911776655',
        kebeleId: basoKebele._id,
        woredaId: woreda._id,
        familySize: 3,
        status: 'verified',
        registeredBy: kebeleOfficer._id
      });

      const res = await request(app)
        .get(`/api/v1/distribution-management/public/ration-check?rationCardId=NSZ-W01-K04-000999`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.found).toBe(true);
      expect(res.body.data.rationCardId).toBe('NSZ-W01-K04-000999');
      expect(res.body.data.collectedInCurrentCycle).toBe(false);
    });
  });

  describe('4. System Administration, Delegated Provisioning & Mandatory Password Reset', () => {
    it('allows SYSTEM_ADMIN to view security overview and trigger a database backup snapshot', async () => {
      // 1. Trigger backup
      const backupRes = await request(app)
        .post('/api/v1/distribution-management/admin/backup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Pre-defense test snapshot' });

      expect(backupRes.status).toBe(201);
      expect(backupRes.body.success).toBe(true);
      expect(backupRes.body.data.backupId).toMatch(/^BACKUP-NSZ-/);
      expect(backupRes.body.data.status).toBe('completed');
      expect(backupRes.body.data.recordCount).toBeGreaterThan(0);

      // 2. View security overview
      const secRes = await request(app)
        .get('/api/v1/distribution-management/admin/security-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(secRes.status).toBe(200);
      expect(secRes.body.success).toBe(true);
      expect(secRes.body.data.totalUsers).toBeGreaterThan(0);
      expect(secRes.body.data.recentBackups.length).toBeGreaterThan(0);
    });

    it('allows SYSTEM_ADMIN to provision Woreda Officer with mandatory temporary password reset', async () => {
      const res = await request(app)
        .post('/api/v1/distribution-management/admin/provision-woreda-officer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Tilahun Gashaw',
          username: 'tgashaw_w01',
          email: 'tilahun@northshewa.gov.et',
          phone: '0911223344',
          password: 'Admin@123456!',
          woredaId: woreda._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('tgashaw_w01');
      expect(res.body.data.role).toBe('WOREDA_OFFICER');
      expect(res.body.data.mustChangePassword).toBe(true);

      // Login check: user receives mustChangePassword: true
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'tgashaw_w01',
          password: 'Admin@123456!'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.mustChangePassword).toBe(true);
    });

    it('allows WOREDA_OFFICER to delegate-provision Kebele and Storekeeper accounts in their Woreda', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${woredaToken}`)
        .send({
          fullName: 'Solomon Worku',
          username: 'sworku_baso_store',
          role: 'STOREKEEPER',
          password: 'Store@123456!',
          locationId: basoKebele._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('sworku_baso_store');
      expect(res.body.data.role).toBe('STOREKEEPER');
      expect(res.body.data.mustChangePassword).toBe(true);
    });

    it('blocks WOREDA_OFFICER from provisioning unauthorized roles like SYSTEM_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${woredaToken}`)
        .send({
          fullName: 'Fake Admin',
          username: 'fake_admin_attempt',
          role: 'SYSTEM_ADMIN',
          password: 'Admin@123456!',
          locationId: woreda._id
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only provision Kebele Record Officers and Cooperative Storekeepers/i);
    });
  });
});
