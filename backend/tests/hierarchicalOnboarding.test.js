require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const Goods = require('../src/models/Goods');
const CooperativeStore = require('../src/models/CooperativeStore');

jest.setTimeout(60000);

describe('Hierarchical Onboarding & Cascading Actor Authentication (Option A)', () => {
  let zoneToken;
  let zoneLocation;
  let zoneUser;

  beforeEach(async () => {
    // 1. Seed Zone root and active commodities
    zoneLocation = await Location.create({
      name: 'North Shewa Zone Administration',
      nameAm: 'የሰሜን ሸዋ ዞን አስተዳደር',
      code: 'NSZ',
      type: 'zone',
      parentId: null,
      population: 485000,
      householdCount: 110000
    });

    await Goods.create([
      { name: 'Edible Cooking Oil', category: 'Subsidized Essential', unit: 'liter', priceCeiling: 130 },
      { name: 'Sugar', category: 'Subsidized Essential', unit: 'kg', priceCeiling: 75 }
    ]);

    const passwordHash = await User.hashPassword('ZoneAdmin@123');
    zoneUser = await User.create({
      fullName: 'Zone Trade Expert',
      username: 'zone_expert_test',
      passwordHash,
      role: 'ZONE_EXPERT',
      locationId: zoneLocation._id,
      status: 'active'
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'zone_expert_test', password: 'ZoneAdmin@123' });
    
    zoneToken = loginRes.body.data.token;
  });

  test('Step 1: Zone Expert creates Woreda with unique ID and provisions Woreda Officer', async () => {
    const res = await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Basona Werana Woreda',
        nameAm: 'ባሶና ወራና ወረዳ',
        code: 'NSZ-W11',
        adminType: 'RURAL_WOREDA',
        population: 85000,
        householdCount: 19500,
        officer: {
          fullName: 'Alemayehu Tadesse',
          username: 'basona_officer',
          password: 'Basona@Secure2026',
          phone: '+251911223344',
          email: 'officer@basona.gov.et'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.woreda.code).toBe('NSZ-W11');
    expect(res.body.data.officer.username).toBe('basona_officer');
    expect(res.body.data.officer.role).toBe('WOREDA_OFFICER');

    // Verify DB integrity
    const savedLoc = await Location.findOne({ code: 'NSZ-W11' });
    expect(savedLoc).toBeTruthy();
    expect(savedLoc.parentId.toString()).toBe(zoneLocation._id.toString());

    const savedUser = await User.findOne({ username: 'basona_officer' });
    expect(savedUser).toBeTruthy();
    expect(savedUser.locationId.toString()).toBe(savedLoc._id.toString());
  });

  test('Step 2: Newly provisioned Woreda Officer logs in with their credentials', async () => {
    // Create woreda + officer
    await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Debre Berhan City Administration',
        nameAm: 'ደብረ ብርሃን ከተማ አስተዳደር',
        code: 'NSZ-W01',
        adminType: 'CITY_ADMIN',
        officer: {
          fullName: 'Abebe Bikila',
          username: 'debreberhan_officer',
          password: 'Debre@Secure2026',
          phone: '+251911998877'
        }
      });

    // Attempt login with newly created officer credentials
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'debreberhan_officer',
        password: 'Debre@Secure2026'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeTruthy();
    expect(loginRes.body.data.user.role).toBe('WOREDA_OFFICER');
    expect(loginRes.body.data.user.location.code).toBe('NSZ-W01');
  });

  test('Step 3: Woreda Officer creates Kebele with unique ID and provisions Kebele Officer', async () => {
    // 1. Provision Woreda Officer
    const woredaRes = await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Debre Berhan City',
        code: 'NSZ-W01',
        adminType: 'CITY_ADMIN',
        officer: {
          fullName: 'Abebe Bikila',
          username: 'debreberhan_officer',
          password: 'Debre@Secure2026'
        }
      });

    // 2. Woreda Officer logs in
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'debreberhan_officer', password: 'Debre@Secure2026' });
    const woredaToken = loginRes.body.data.token;
    const woredaId = woredaRes.body.data.woreda._id;

    // 3. Woreda Officer adds Kebele
    const kebeleRes = await request(app)
      .post('/api/v1/locations/kebele-with-officer')
      .set('Authorization', `Bearer ${woredaToken}`)
      .send({
        name: 'Bakelo Kebele 05',
        nameAm: 'ባኬሎ ቀበሌ 05',
        code: 'NSZ-W01-K05',
        population: 14000,
        householdCount: 3200,
        gots: ['Got 01 (መሀል ሰፈር)', 'Got 02 (አባይ ማዶ)'],
        officer: {
          fullName: 'Fatuma Mohammed',
          username: 'bakelo_officer',
          password: 'Bakelo@Secure2026',
          phone: '+251911445566'
        }
      });

    expect(kebeleRes.status).toBe(201);
    expect(kebeleRes.body.success).toBe(true);
    expect(kebeleRes.body.data.kebele.code).toBe('NSZ-W01-K05');
    expect(kebeleRes.body.data.kebele.parentId.toString()).toBe(woredaId.toString());
    expect(kebeleRes.body.data.officer.role).toBe('KEBELE_OFFICER');

    // 4. Verify Kebele Officer can log in with their own password
    const kebeleLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'bakelo_officer', password: 'Bakelo@Secure2026' });

    expect(kebeleLoginRes.status).toBe(200);
    expect(kebeleLoginRes.body.data.user.role).toBe('KEBELE_OFFICER');
    expect(kebeleLoginRes.body.data.user.location.code).toBe('NSZ-W01-K05');
  });

  test('Step 4: Woreda Officer registers Distributor Store and provisions Storekeeper', async () => {
    // 1. Provision Woreda Officer & Kebele
    await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Debre Berhan City',
        code: 'NSZ-W01',
        officer: { fullName: 'Abebe', username: 'db_admin', password: 'Debre@Secure2026' }
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'db_admin', password: 'Debre@Secure2026' });
    const woredaToken = loginRes.body.data.token;

    const kebeleRes = await request(app)
      .post('/api/v1/locations/kebele-with-officer')
      .set('Authorization', `Bearer ${woredaToken}`)
      .send({
        name: 'Kebele 06',
        code: 'NSZ-W01-K06',
        officer: { fullName: 'Mulugeta', username: 'k06_admin', password: 'Kebele@Secure2026' }
      });
    const kebeleId = kebeleRes.body.data.kebele._id;

    // 2. Register Distributor Store & Storekeeper
    const distRes = await request(app)
      .post('/api/v1/locations/distributor-with-storekeeper')
      .set('Authorization', `Bearer ${woredaToken}`)
      .send({
        name: 'Kebele 06 Farmers Consumer Cooperative Store',
        code: 'DIST-NSZ-W01-K06',
        kebeleId,
        contactPhone: '+251911009988',
        address: 'Main Kebele Square',
        storekeeper: {
          fullName: 'Solomon Bekele',
          username: 'k06_storekeeper',
          password: 'Store@Secure2026',
          phone: '+251911009988'
        }
      });

    expect(distRes.status).toBe(201);
    expect(distRes.body.success).toBe(true);
    expect(distRes.body.data.distributor.code).toBe('DIST-NSZ-W01-K06');
    expect(distRes.body.data.storekeeper.role).toBe('STOREKEEPER');

    // 3. Storekeeper logs in
    const storeLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'k06_storekeeper', password: 'Store@Secure2026' });

    expect(storeLoginRes.status).toBe(200);
    expect(storeLoginRes.body.data.user.role).toBe('STOREKEEPER');
  });

  test('Guarantees unique ID and username non-collision constraints', async () => {
    // 1. Create first Woreda
    await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Woreda One',
        code: 'NSZ-W01',
        officer: { fullName: 'Abebe', username: 'woreda_one_admin', password: 'Pass@Secure2026' }
      });

    // 2. Try duplicate location code
    const dupCodeRes = await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Another Woreda',
        code: 'NSZ-W01',
        officer: { fullName: 'Chala', username: 'woreda_two_admin', password: 'Pass@Secure2026' }
      });
    expect(dupCodeRes.status).toBe(409);

    // 3. Try duplicate username
    const dupUserRes = await request(app)
      .post('/api/v1/locations/woreda-with-officer')
      .set('Authorization', `Bearer ${zoneToken}`)
      .send({
        name: 'Woreda Two',
        code: 'NSZ-W02',
        officer: { fullName: 'Duplicate Abebe', username: 'woreda_one_admin', password: 'Pass@Secure2026' }
      });
    expect(dupUserRes.status).toBe(409);
  });
});
