require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./database');
const Location = require('../models/Location');
const User = require('../models/User');
const Goods = require('../models/Goods');
const Setting = require('../models/Setting');
const QuotaRule = require('../models/QuotaRule');
const StockLevel = require('../models/StockLevel');
const Inventory = require('../models/Inventory');
const Beneficiary = require('../models/Beneficiary');
const StockMovement = require('../models/StockMovement');
const CooperativeStore = require('../models/CooperativeStore');
const DistributionCycle = require('../models/DistributionCycle');
const DistributionTransaction = require('../models/DistributionTransaction');
const GotSchedule = require('../models/GotSchedule');
const Counter = require('../models/Counter');
const { NORTH_SHEWA_WOREDAS, INITIAL_KEBELES } = require('../constants/northShewaWoredas');

// Demographics for all 28 North Shewa Woredas (6 City/Town Administrations + 22 Rural Woredas)
const WOREDA_DEMOGRAPHICS = {
  'NSZ-W01': { population: 185000, householdCount: 45000 },
  'NSZ-W02': { population: 65000, householdCount: 16000 },
  'NSZ-W03': { population: 42000, householdCount: 10500 },
  'NSZ-W04': { population: 38000, householdCount: 9500 },
  'NSZ-W05': { population: 35000, householdCount: 8800 },
  'NSZ-W06': { population: 48000, householdCount: 12000 },
  'NSZ-W07': { population: 92000, householdCount: 21000 },
  'NSZ-W08': { population: 88000, householdCount: 20000 },
  'NSZ-W09': { population: 95000, householdCount: 22000 },
  'NSZ-W10': { population: 72000, householdCount: 16500 },
  'NSZ-W11': { population: 145000, householdCount: 33000 },
  'NSZ-W12': { population: 48000, householdCount: 11000 },
  'NSZ-W13': { population: 130000, householdCount: 30000 },
  'NSZ-W14': { population: 68000, householdCount: 15500 },
  'NSZ-W15': { population: 76000, householdCount: 17500 },
  'NSZ-W16': { population: 64000, householdCount: 14800 },
  'NSZ-W17': { population: 142000, householdCount: 32500 },
  'NSZ-W18': { population: 138000, householdCount: 31500 },
  'NSZ-W19': { population: 56000, householdCount: 13000 },
  'NSZ-W20': { population: 62000, householdCount: 14200 },
  'NSZ-W21': { population: 98000, householdCount: 22500 },
  'NSZ-W22': { population: 152000, householdCount: 35000 },
  'NSZ-W23': { population: 94000, householdCount: 21500 },
  'NSZ-W24': { population: 146000, householdCount: 33500 },
  'NSZ-W25': { population: 82000, householdCount: 19000 },
  'NSZ-W26': { population: 104000, householdCount: 24000 },
  'NSZ-W27': { population: 74000, householdCount: 17000 },
  'NSZ-W28': { population: 95000, householdCount: 22000 }
};

const totalZonePopulation = Object.values(WOREDA_DEMOGRAPHICS).reduce((acc, curr) => acc + curr.population, 0);
const totalZoneHouseholds = Object.values(WOREDA_DEMOGRAPHICS).reduce((acc, curr) => acc + curr.householdCount, 0);

const seedData = async ({ shouldConnect = true, shouldDisconnect = true } = {}) => {
  try {
    console.log('--- Starting Production-Grade Database Seeding for North Shewa Zone ---');
    console.log('Case Study: Baso Kebele, Debre Berhan City Administration');
    if (shouldConnect) {
      await connectDB();
    }

    // Clear existing collections
    console.log('Clearing existing collections...');
    await Promise.all([
      Location.deleteMany({}),
      User.deleteMany({}),
      Goods.deleteMany({}),
      Setting.deleteMany({}),
      QuotaRule.deleteMany({}),
      StockLevel.deleteMany({}),
      Inventory.deleteMany({}),
      Beneficiary.deleteMany({}),
      StockMovement.deleteMany({}),
      CooperativeStore.deleteMany({}),
      DistributionCycle.deleteMany({}),
      DistributionTransaction.deleteMany({}),
      GotSchedule.deleteMany({}),
      Counter.deleteMany({})
    ]);

    // 1. Seed Hierarchical Administrative Offices
    console.log('Seeding administrative hierarchy for North Shewa Zone...');
    const zone = await Location.create({
      name: 'North Shewa Zone Administration',
      nameAm: 'የሰሜን ሸዋ ዞን አስተዳደር',
      code: 'NSZ',
      type: 'zone',
      parentId: null,
      population: totalZonePopulation,
      householdCount: totalZoneHouseholds
    });

    const woredas = await Location.create(
      NORTH_SHEWA_WOREDAS.map(w => ({
        name: w.nameEn,
        nameAm: w.nameAm,
        code: w.woredaCode,
        woredaCode: w.woredaCode,
        type: 'woreda',
        adminType: w.type,
        parentId: zone._id,
        population: WOREDA_DEMOGRAPHICS[w.woredaCode]?.population || 80000,
        householdCount: WOREDA_DEMOGRAPHICS[w.woredaCode]?.householdCount || 18000
      }))
    );

    const debreBerhan = woredas.find(w => w.code === 'NSZ-W01') || woredas[0];
    const initialBaso = INITIAL_KEBELES[0];

    // Seed Kebeles under Debre Berhan City Administration (NSZ-W01)
    const kebeles = await Location.create([
      {
        name: initialBaso.nameEn,
        nameAm: initialBaso.nameAm,
        code: initialBaso.kebeleCode,
        type: 'kebele',
        parentId: debreBerhan._id,
        population: 18500,
        householdCount: 4200,
        gots: ['Got 01 (መሀል ሰፈር)', 'Got 02 (አባይ ማዶ)', 'Got 03 (ወይራ ሰፈር)', 'Got 04 (ብርሃን ሰፈር)']
      },
      {
        name: 'Kebele 01 (Tegbared)',
        nameAm: 'ቀበሌ 01 (ተግባረዕድ)',
        code: 'NSZ-W01-K01',
        type: 'kebele',
        parentId: debreBerhan._id,
        population: 14200,
        householdCount: 3400,
        gots: ['Got 01 (ተግባረዕድ)', 'Got 02 (ገበያ ማዶ)']
      },
      {
        name: 'Kebele 02',
        nameAm: 'ቀበሌ 02',
        code: 'NSZ-W01-K02',
        type: 'kebele',
        parentId: debreBerhan._id,
        population: 12800,
        householdCount: 3100,
        gots: ['Got 01 (መሀል ከተማ)', 'Got 02 (ሰላም ሰፈር)']
      },
      {
        name: 'Kebele 03',
        nameAm: 'ቀበሌ 03',
        code: 'NSZ-W01-K03',
        type: 'kebele',
        parentId: debreBerhan._id,
        population: 15400,
        householdCount: 3700,
        gots: ['Got 01 (አራዳ)', 'Got 02 (ማርያም ሰፈር)']
      }
    ]);

    const basoKebele = kebeles[0];

    // 2. Seed Subsidized Essential Commodities with Official Price Ceilings
    console.log('Seeding subsidized essential commodities...');
    const [oil, sugar, wheat, teff] = await Goods.create([
      {
        name: 'Edible Cooking Oil',
        nameAm: 'የምግብ ዘይት',
        category: 'Subsidized Essential',
        unit: 'liter',
        priceCeiling: 130, // 130 ETB per Liter
        defaultQuotaPerPerson: 2,
        defaultMaxPerHousehold: 10,
        status: 'active'
      },
      {
        name: 'Sugar',
        nameAm: 'ስኳር',
        category: 'Subsidized Essential',
        unit: 'kg',
        priceCeiling: 75, // 75 ETB per Kg
        defaultQuotaPerPerson: 2,
        defaultMaxPerHousehold: 10,
        status: 'active'
      },
      {
        name: 'Wheat Flour',
        nameAm: 'የስንዴ ዱቄት',
        category: 'Subsidized Essential',
        unit: 'kg',
        priceCeiling: 65, // 65 ETB per Kg
        defaultQuotaPerPerson: 10,
        defaultMaxPerHousehold: 50,
        status: 'active'
      },
      {
        name: 'Teff',
        nameAm: 'ጤፍ',
        category: 'Subsidized Essential',
        unit: 'kg',
        priceCeiling: 95, // 95 ETB per Kg
        defaultQuotaPerPerson: 15,
        defaultMaxPerHousehold: 60,
        status: 'active'
      }
    ]);

    // 3. Seed Consumer Cooperative Store for Baso Kebele
    console.log('Seeding Baso Kebele Consumer Cooperative Store...');
    const basoStore = await CooperativeStore.create({
      name: initialBaso.cooperativeStoreNameEn,
      nameAm: initialBaso.cooperativeStoreNameAm,
      code: 'COOP-NSZ-W01-K04',
      kebeleId: basoKebele._id,
      woredaId: debreBerhan._id,
      contactPhone: '+251911445566',
      address: 'Baso Kebele Main Road, Near Kebele Administration Office',
      stocks: [
        {
          goodsId: oil._id,
          goodsName: oil.name,
          goodsNameAm: oil.nameAm,
          unit: oil.unit,
          totalStock: 5000,
          lastReceivedAt: new Date()
        },
        {
          goodsId: sugar._id,
          goodsName: sugar.name,
          goodsNameAm: sugar.nameAm,
          unit: sugar.unit,
          totalStock: 4000,
          lastReceivedAt: new Date()
        },
        {
          goodsId: wheat._id,
          goodsName: wheat.name,
          goodsNameAm: wheat.nameAm,
          unit: wheat.unit,
          totalStock: 10000,
          lastReceivedAt: new Date()
        },
        {
          goodsId: teff._id,
          goodsName: teff.name,
          goodsNameAm: teff.nameAm,
          unit: teff.unit,
          totalStock: 6000,
          lastReceivedAt: new Date()
        }
      ]
    });

    // 4. Seed Enterprise Staff Users for All 5 Actors
    console.log('Seeding staff accounts for all 5 enterprise actors...');
    const defaultPassword = await User.hashPassword('Admin@123456');

    const users = await User.create([
      {
        fullName: 'Zone ICT Administrator',
        username: 'admin',
        email: 'ict.admin@northshewa.gov.et',
        phone: '+251911000001',
        passwordHash: defaultPassword,
        role: 'SYSTEM_ADMIN',
        locationId: zone._id,
        language: 'en'
      },
      {
        fullName: 'Abebe Tadesse (Zone Trade Expert)',
        username: 'zone_expert',
        email: 'trade.expert@northshewa.gov.et',
        phone: '+251911000002',
        passwordHash: defaultPassword,
        role: 'ZONE_EXPERT',
        locationId: zone._id,
        language: 'am'
      },
      {
        fullName: 'Almaz Belay (City Trade Officer)',
        username: 'woreda_officer',
        email: 'woreda.trade@northshewa.gov.et',
        phone: '+251911000003',
        passwordHash: defaultPassword,
        role: 'WOREDA_OFFICER',
        locationId: debreBerhan._id,
        language: 'am'
      },
      {
        fullName: 'Kebede Bekele (Baso Kebele Record Officer)',
        username: 'kebele_officer',
        email: 'baso.kebele@northshewa.gov.et',
        phone: '+251911000004',
        passwordHash: defaultPassword,
        role: 'KEBELE_OFFICER',
        locationId: basoKebele._id,
        language: 'am'
      },
      {
        fullName: 'Getachew Alemu (Baso Storekeeper)',
        username: 'storekeeper',
        email: 'baso.storekeeper@northshewa.gov.et',
        phone: '+251911000005',
        passwordHash: defaultPassword,
        role: 'STOREKEEPER',
        locationId: basoKebele._id,
        language: 'am'
      },
      // Backward compatibility login aliases
      {
        fullName: 'Zone Officer (Legacy Alias)',
        username: 'zone_officer',
        email: 'zone.officer@northshewa.gov.et',
        phone: '+251911000012',
        passwordHash: defaultPassword,
        role: 'ZONE_EXPERT',
        locationId: zone._id,
        language: 'am'
      },
      {
        fullName: 'Store Manager (Legacy Alias)',
        username: 'store_manager',
        email: 'store.manager@northshewa.gov.et',
        phone: '+251911000015',
        passwordHash: defaultPassword,
        role: 'STOREKEEPER',
        locationId: basoKebele._id,
        language: 'am'
      }
    ]);

    const [adminUser, zoneExpertUser, woredaOfficerUser, kebeleOfficerUser, storekeeperUser] = users;
    basoStore.storekeeperId = storekeeperUser._id;
    await basoStore.save();

    // 5. Seed Legacy QuotaRules for backward compatibility
    console.log('Seeding legacy quota rules...');
    await QuotaRule.create([
      { goodsId: sugar._id, quantityPerPerson: 2, maxPerHousehold: 10, periodType: 'monthly', active: true },
      { goodsId: oil._id, quantityPerPerson: 2, maxPerHousehold: 10, periodType: 'monthly', active: true },
      { goodsId: wheat._id, quantityPerPerson: 10, maxPerHousehold: 50, periodType: 'monthly', active: true },
      { goodsId: teff._id, quantityPerPerson: 15, maxPerHousehold: 60, periodType: 'monthly', active: true }
    ]);

    // 6. Initialize Counter for Hierarchical Ration IDs in Baso Kebele
    await Counter.create({
      key: 'RATION-NSZ-W01-K04',
      seq: 124 // next sequence will be 125 -> NSZ-W01-K04-000125
    });

    // 7. Seed Sample Households in Baso Kebele (NSZ-W01-K04)
    console.log('Seeding sample verified households in Baso Kebele...');
    const now = new Date();

    const sampleHouseholds = [
      {
        rationCardId: 'NSZ-W01-K04-000125',
        faydaId: '123456789012',
        idNumber: '123456789012',
        idType: 'fayda',
        headName: 'Abebe Kebede Tessema',
        gender: 'male',
        maritalStatus: 'Married',
        phone: '0911223344',
        got: 'Got 01 (መሀል ሰፈር)',
        houseNumber: 'H-104',
        address: 'Baso Kebele, Got 01, Near Primary School',
        kebeleId: basoKebele._id,
        woredaId: debreBerhan._id,
        familySize: 4,
        familyMembers: [
          {
            name: 'Tirhas Mengesha',
            relationship: 'Spouse',
            faydaOrBirthId: '123456789013',
            age: 34,
            gender: 'female'
          },
          {
            name: 'Yohannes Abebe',
            relationship: 'Child',
            faydaOrBirthId: 'BC-DB-2018-091',
            age: 8,
            gender: 'male'
          },
          {
            name: 'Selam Abebe',
            relationship: 'Child',
            faydaOrBirthId: 'BC-DB-2021-144',
            age: 5,
            gender: 'female'
          }
        ],
        status: 'verified',
        registeredBy: kebeleOfficerUser._id,
        verifiedBy: kebeleOfficerUser._id,
        verifiedAt: now
      },
      {
        rationCardId: 'NSZ-W01-K04-000126',
        faydaId: '123456789020',
        idNumber: '123456789020',
        idType: 'fayda',
        headName: 'Aster Tadesse Wolde',
        gender: 'female',
        maritalStatus: 'Widowed',
        phone: '0922334455',
        got: 'Got 02 (አባይ ማዶ)',
        houseNumber: 'H-215',
        address: 'Baso Kebele, Got 02, Behind Health Post',
        kebeleId: basoKebele._id,
        woredaId: debreBerhan._id,
        familySize: 3,
        familyMembers: [
          {
            name: 'Dawit Girma',
            relationship: 'Child',
            faydaOrBirthId: '123456789021',
            age: 16,
            gender: 'male'
          },
          {
            name: 'Bethlehem Girma',
            relationship: 'Child',
            faydaOrBirthId: 'BC-DB-2015-882',
            age: 12,
            gender: 'female'
          }
        ],
        status: 'verified',
        registeredBy: kebeleOfficerUser._id,
        verifiedBy: kebeleOfficerUser._id,
        verifiedAt: now
      },
      {
        rationCardId: 'NSZ-W01-K04-000127',
        faydaId: '123456789030',
        idNumber: '123456789030',
        idType: 'fayda',
        headName: 'Dereje Haile Mariam',
        gender: 'male',
        maritalStatus: 'Single',
        phone: '0933445566',
        got: 'Got 01 (መሀል ሰፈር)',
        houseNumber: 'H-034',
        address: 'Baso Kebele, Got 01, Commercial Area',
        kebeleId: basoKebele._id,
        woredaId: debreBerhan._id,
        familySize: 1,
        familyMembers: [],
        status: 'verified',
        registeredBy: kebeleOfficerUser._id,
        verifiedBy: kebeleOfficerUser._id,
        verifiedAt: now
      },
      {
        rationCardId: 'NSZ-W01-K04-000128',
        faydaId: '123456789040',
        idNumber: '123456789040',
        idType: 'fayda',
        headName: 'Genet Worku Negash',
        gender: 'female',
        maritalStatus: 'Divorced',
        phone: '0944556677',
        got: 'Got 03 (ወይራ ሰፈር)',
        houseNumber: 'H-412',
        address: 'Baso Kebele, Got 03',
        kebeleId: basoKebele._id,
        woredaId: debreBerhan._id,
        familySize: 2,
        familyMembers: [
          {
            name: 'Kalkidan Berhanu',
            relationship: 'Child',
            faydaOrBirthId: 'BC-DB-2019-331',
            age: 7,
            gender: 'female'
          }
        ],
        status: 'verified',
        registeredBy: kebeleOfficerUser._id,
        verifiedBy: kebeleOfficerUser._id,
        verifiedAt: now
      }
    ];

    await Beneficiary.create(sampleHouseholds);

    // Update location live counts
    await Location.findByIdAndUpdate(basoKebele._id, {
      householdCount: 4204,
      population: 18510
    });

    // 8. Seed Active Distribution Cycle with Proportional Allocations
    console.log('Seeding active distribution cycle and allocations...');
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const letterNo = 'AL-NSZ-W01-2026-004';

    await DistributionCycle.create({
      cycleCode: `CYCLE-${currentMonth}`,
      title: `Subsidized Essential Commodities Distribution Cycle - ${currentMonth}`,
      titleAm: `የ${currentMonth} የድጎማ መሰረታዊ ሸቀጦች የስርጭት ዙር`,
      month: currentMonth,
      status: 'active',
      createdBy: zoneExpertUser._id,
      zoneAllocations: [
        {
          woredaId: debreBerhan._id,
          goodsId: oil._id,
          goodsName: oil.name,
          goodsNameAm: oil.nameAm,
          unit: oil.unit,
          allocatedQuantity: 28000,
          populationSharePercentage: 36.1,
          status: 'allocated'
        },
        {
          woredaId: debreBerhan._id,
          goodsId: sugar._id,
          goodsName: sugar.name,
          goodsNameAm: sugar.nameAm,
          unit: sugar.unit,
          allocatedQuantity: 25000,
          populationSharePercentage: 36.1,
          status: 'allocated'
        },
        {
          woredaId: (woredas.find(w => w.code === 'NSZ-W02') || woredas[1])._id, // Shewa Robit Town Administration (NSZ-W02)
          goodsId: oil._id,
          goodsName: oil.name,
          goodsNameAm: oil.nameAm,
          unit: oil.unit,
          allocatedQuantity: 22000,
          populationSharePercentage: 27.8,
          status: 'allocated'
        }
      ],
      kebeleAllocations: [
        {
          kebeleId: basoKebele._id,
          storeId: basoStore._id,
          goodsId: oil._id,
          goodsName: oil.name,
          goodsNameAm: oil.nameAm,
          unit: oil.unit,
          allocatedQuantity: 5000,
          receivedQuantity: 5000,
          isReceived: true,
          receivedAt: now,
          receivedBy: storekeeperUser._id,
          allocationLetterNo: letterNo,
          allocationLetterDate: now,
          quotaRule: {
            quantityPerPerson: 2,
            maxPerHousehold: 10,
            unitPrice: 130
          },
          distributionWindow: {
            startDate: now,
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        },
        {
          kebeleId: basoKebele._id,
          storeId: basoStore._id,
          goodsId: sugar._id,
          goodsName: sugar.name,
          goodsNameAm: sugar.nameAm,
          unit: sugar.unit,
          allocatedQuantity: 4000,
          receivedQuantity: 4000,
          isReceived: true,
          receivedAt: now,
          receivedBy: storekeeperUser._id,
          allocationLetterNo: letterNo,
          allocationLetterDate: now,
          quotaRule: {
            quantityPerPerson: 2,
            maxPerHousehold: 10,
            unitPrice: 75
          },
          distributionWindow: {
            startDate: now,
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        },
        {
          kebeleId: basoKebele._id,
          storeId: basoStore._id,
          goodsId: wheat._id,
          goodsName: wheat.name,
          goodsNameAm: wheat.nameAm,
          unit: wheat.unit,
          allocatedQuantity: 10000,
          receivedQuantity: 10000,
          isReceived: true,
          receivedAt: now,
          receivedBy: storekeeperUser._id,
          allocationLetterNo: letterNo,
          allocationLetterDate: now,
          quotaRule: {
            quantityPerPerson: 10,
            maxPerHousehold: 50,
            unitPrice: 65
          },
          distributionWindow: {
            startDate: now,
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        }
      ]
    });

    // 9. Seed Got Pickup Schedules for Baso Kebele
    console.log('Seeding village block (Got) pickup schedules...');
    const day = ms => new Date(Date.now() + ms);

    await GotSchedule.create([
      {
        cycleId: (await DistributionCycle.findOne())._id,
        kebeleId: basoKebele._id,
        got: 'Got 01 (መሀል ሰፈር)',
        distributionDate: now,
        timeSlot: '08:30 AM - 12:30 PM',
        status: 'active_today',
        targetHouseholds: 950,
        notes: 'Priority service for senior citizens and disabled residents in the morning slot.',
        createdBy: kebeleOfficerUser._id
      },
      {
        cycleId: (await DistributionCycle.findOne())._id,
        kebeleId: basoKebele._id,
        got: 'Got 02 (አባይ ማዶ)',
        distributionDate: day(24 * 60 * 60 * 1000),
        timeSlot: '08:30 AM - 04:30 PM',
        status: 'scheduled',
        targetHouseholds: 1100,
        notes: 'Residents please bring original ration booklets.',
        createdBy: kebeleOfficerUser._id
      },
      {
        cycleId: (await DistributionCycle.findOne())._id,
        kebeleId: basoKebele._id,
        got: 'Got 03 (ወይራ ሰፈር)',
        distributionDate: day(2 * 24 * 60 * 60 * 1000),
        timeSlot: '08:30 AM - 04:30 PM',
        status: 'scheduled',
        targetHouseholds: 1050,
        createdBy: kebeleOfficerUser._id
      },
      {
        cycleId: (await DistributionCycle.findOne())._id,
        kebeleId: basoKebele._id,
        got: 'Got 04 (ብርሃን ሰፈር)',
        distributionDate: day(3 * 24 * 60 * 60 * 1000),
        timeSlot: '08:30 AM - 04:30 PM',
        status: 'scheduled',
        targetHouseholds: 1104,
        createdBy: kebeleOfficerUser._id
      }
    ]);

    // 10. Seed System Settings
    console.log('Seeding system settings...');
    await Setting.create([
      {
        key: 'systemScope',
        value: 'North Shewa Zone - Amhara Region',
        description: 'Administrative operational jurisdiction'
      },
      {
        key: 'caseStudyKebele',
        value: 'Baso Kebele, Debre Berhan City Administration',
        description: 'Demonstration and case study kebele'
      },
      {
        key: 'calendar',
        value: 'ethiopian',
        description: 'Active calendar formatting system'
      }
    ]);

    console.log('--- Production-Grade Database Seeding Completed Successfully! ---');
    console.log('Case Study: Baso Kebele (NSZ-W01-K04), Debre Berhan City Administration (NSZ-W01)');
    console.log('Demo Credentials for All 5 Enterprise Actors:');
    console.log('  1. SYSTEM_ADMIN:    Username: admin          / Password: Admin@123456');
    console.log('  2. ZONE_EXPERT:     Username: zone_expert    / Password: Admin@123456');
    console.log('  3. WOREDA_OFFICER:  Username: woreda_officer / Password: Admin@123456');
    console.log('  4. KEBELE_OFFICER:  Username: kebele_officer / Password: Admin@123456');
    console.log('  5. STOREKEEPER:     Username: storekeeper    / Password: Admin@123456');
    console.log('  6. PUBLIC PORTAL:   Route:    /public        (Zero Login Required)');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
