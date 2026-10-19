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

const seedData = async ({ shouldConnect = true, shouldDisconnect = true } = {}) => {
  try {
    console.log('--- Starting Comprehensive Database Seeding ---');
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
      StockMovement.deleteMany({})
    ]);

    // 1. Seed Office Locations (Zone -> Woredas -> Kebeles)
    console.log('Seeding administrative hierarchy for North Shewa Zone...');
    const zone = await Location.create({
      name: 'North Shewa Zone Administration',
      nameAm: 'የሰሜን ሸዋ ዞን አስተዳደር',
      code: 'ETH-AM-NSZ',
      type: 'zone',
      parentId: null
    });

    const woredas = await Location.create([
      {
        name: 'Debre Berhan Administration',
        nameAm: 'ደብረ ብርሃን ከተማ አስተዳደር',
        code: 'WRD-DB',
        type: 'woreda',
        parentId: zone._id
      },
      {
        name: 'Basona Werana Woreda',
        nameAm: 'ባሶና ወራና ወረዳ',
        code: 'WRD-BW',
        type: 'woreda',
        parentId: zone._id
      },
      {
        name: 'Ankober Woreda',
        nameAm: 'አንኮበር ወረዳ',
        code: 'WRD-ANK',
        type: 'woreda',
        parentId: zone._id
      },
      {
        name: 'Moretna Jiru Woreda',
        nameAm: 'ሞረትና ጅሩ ወረዳ',
        code: 'WRD-MJ',
        type: 'woreda',
        parentId: zone._id
      }
    ]);

    const debreBerhanWoreda = woredas[0];

    const kebeles = await Location.create([
      {
        name: 'Kebele 01 (Tegbared)',
        nameAm: 'ቀበሌ 01 (ተግባረዕድ)',
        code: 'KEB-DB-01',
        type: 'kebele',
        parentId: debreBerhanWoreda._id
      },
      {
        name: 'Kebele 02',
        nameAm: 'ቀበሌ 02',
        code: 'KEB-DB-02',
        type: 'kebele',
        parentId: debreBerhanWoreda._id
      },
      {
        name: 'Kebele 03',
        nameAm: 'ቀበሌ 03',
        code: 'KEB-DB-03',
        type: 'kebele',
        parentId: debreBerhanWoreda._id
      }
    ]);

    const kebele01 = kebeles[0];

    // 2. Seed Essential Goods
    console.log('Seeding essential goods...');
    const [sugar, oil, wheat, rice] = await Goods.create([
      {
        name: 'Sugar',
        nameAm: 'ስኳር',
        category: 'Food Staples',
        unit: 'kg'
      },
      {
        name: 'Edible Cooking Oil',
        nameAm: 'የምግብ ዘይት',
        category: 'Food Staples',
        unit: 'liter'
      },
      {
        name: 'Wheat Flour',
        nameAm: 'የስንዴ ዱቄት',
        category: 'Grains & Flour',
        unit: 'kg'
      },
      {
        name: 'Rice',
        nameAm: 'ሩዝ',
        category: 'Grains & Flour',
        unit: 'kg'
      }
    ]);

    // 3. Seed Users
    console.log('Seeding users across administrative tiers...');
    const defaultPassword = await User.hashPassword('Admin@123456');

    const [adminUser, zoneOfficer, woredaOfficer, kebeleOfficer, storeManager] = await User.create([
      {
        fullName: 'System Administrator',
        username: 'admin',
        email: 'admin@northshewa.gov.et',
        passwordHash: defaultPassword,
        role: 'admin',
        locationId: zone._id,
        language: 'en'
      },
      {
        fullName: 'Abebe Tadesse (Zone Officer)',
        username: 'zone_officer',
        email: 'zone.officer@northshewa.gov.et',
        passwordHash: defaultPassword,
        role: 'zone_officer',
        locationId: zone._id,
        language: 'am'
      },
      {
        fullName: 'Almaz Belay (Woreda Officer)',
        username: 'woreda_officer',
        email: 'woreda.db@northshewa.gov.et',
        passwordHash: defaultPassword,
        role: 'woreda_officer',
        locationId: debreBerhanWoreda._id,
        language: 'am'
      },
      {
        fullName: 'Kebede Bekele (Kebele Officer)',
        username: 'kebele_officer',
        email: 'kebele01.db@northshewa.gov.et',
        passwordHash: defaultPassword,
        role: 'kebele_officer',
        locationId: kebele01._id,
        language: 'am'
      },
      {
        fullName: 'Getachew Alemu (Zone Store Manager)',
        username: 'store_manager',
        email: 'store.zone@northshewa.gov.et',
        passwordHash: defaultPassword,
        role: 'store_manager',
        locationId: zone._id,
        language: 'am'
      }
    ]);

    // 4. Seed Quota Rules
    console.log('Seeding family quota rules...');
    await QuotaRule.create([
      {
        goodsId: sugar._id,
        quantityPerPerson: 3, // 3 kg / person
        maxPerHousehold: 15,  // max 15 kg
        periodType: 'monthly',
        active: true
      },
      {
        goodsId: oil._id,
        quantityPerPerson: 2, // 2 liters / person
        maxPerHousehold: 10,  // max 10 liters
        periodType: 'monthly',
        active: true
      },
      {
        goodsId: wheat._id,
        quantityPerPerson: 15, // 15 kg / person
        maxPerHousehold: 75,   // max 75 kg
        periodType: 'monthly',
        active: true
      },
      {
        goodsId: rice._id,
        quantityPerPerson: 5,  // 5 kg / person
        maxPerHousehold: 25,   // max 25 kg
        periodType: 'monthly',
        active: true
      }
    ]);

    // 5. Seed Stock Thresholds
    console.log('Seeding minimum stock thresholds...');
    await StockLevel.create([
      { locationId: zone._id, goodsId: sugar._id, minLevel: 2000 },
      { locationId: zone._id, goodsId: oil._id, minLevel: 1000 },
      { locationId: kebele01._id, goodsId: sugar._id, minLevel: 200 },
      { locationId: kebele01._id, goodsId: oil._id, minLevel: 100 }
    ]);

    // 6. Seed Initial Stock at Zone Store & Kebele Store
    console.log('Seeding initial warehouse batches...');
    const now = new Date();
    const futureDate = months => new Date(now.getFullYear(), now.getMonth() + months, now.getDate());

    const initialBatches = [
      // Zone Store Batches
      {
        locationId: zone._id,
        goodsId: sugar._id,
        batchNumber: 'SUG-2026-B1',
        quantity: 25000,
        receivedDate: now,
        expiryDate: futureDate(12),
        status: 'available'
      },
      {
        locationId: zone._id,
        goodsId: oil._id,
        batchNumber: 'OIL-2026-B1',
        quantity: 12000,
        receivedDate: now,
        expiryDate: futureDate(10),
        status: 'available'
      },
      {
        locationId: zone._id,
        goodsId: wheat._id,
        batchNumber: 'WHT-2026-B1',
        quantity: 50000,
        receivedDate: now,
        expiryDate: futureDate(8),
        status: 'available'
      },
      // Kebele 01 Store Batches for immediate distribution
      {
        locationId: kebele01._id,
        goodsId: sugar._id,
        batchNumber: 'SUG-KEB-B1',
        quantity: 1200,
        receivedDate: now,
        expiryDate: futureDate(6),
        status: 'available'
      },
      {
        locationId: kebele01._id,
        goodsId: oil._id,
        batchNumber: 'OIL-KEB-B1',
        quantity: 600,
        receivedDate: now,
        expiryDate: futureDate(6),
        status: 'available'
      }
    ];

    for (const b of initialBatches) {
      const createdBatch = await Inventory.create(b);
      await StockMovement.create({
        type: 'receipt',
        locationId: b.locationId,
        goodsId: b.goodsId,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        quantityChange: b.quantity,
        balanceAfter: b.quantity,
        refType: 'supplier_receipt',
        reason: 'Initial system stock initialization',
        createdBy: adminUser._id
      });
    }

    // 7. Seed Sample Beneficiaries at Kebele 01
    console.log('Seeding sample households for Kebele 01...');
    await Beneficiary.create([
      {
        headName: 'Mulugeta Haile',
        gender: 'male',
        idType: 'fayda',
        idNumber: 'ETH-FAYDA-98214301',
        phone: '0911223344',
        address: 'House 142, Tegbared',
        kebeleId: kebele01._id,
        woredaId: debreBerhanWoreda._id,
        familySize: 4,
        status: 'verified',
        registeredBy: kebeleOfficer._id,
        verifiedBy: kebeleOfficer._id,
        verifiedAt: now
      },
      {
        headName: 'Tirhas Mengesha',
        gender: 'female',
        idType: 'kebele',
        idNumber: 'KEB-01-90812',
        phone: '0922334455',
        address: 'House 305, Near Health Post',
        kebeleId: kebele01._id,
        woredaId: debreBerhanWoreda._id,
        familySize: 5,
        status: 'verified',
        registeredBy: kebeleOfficer._id,
        verifiedBy: kebeleOfficer._id,
        verifiedAt: now
      },
      {
        headName: 'Tadesse Assefa',
        gender: 'male',
        idType: 'kebele',
        idNumber: 'KEB-01-44512',
        phone: '0933445566',
        address: 'House 088',
        kebeleId: kebele01._id,
        woredaId: debreBerhanWoreda._id,
        familySize: 2,
        status: 'registered',
        registeredBy: kebeleOfficer._id
      }
    ]);

    // 8. Seed Settings
    console.log('Seeding system settings...');
    await Setting.create([
      {
        key: 'expiryWarningDays',
        value: 30,
        description: 'Days before expiration to raise an alert'
      },
      {
        key: 'transferOverdueDays',
        value: 3,
        description: 'Days after dispatch before an in-transit transfer is flagged overdue'
      },
      {
        key: 'calendar',
        value: 'gregorian',
        description: 'Active calendar system (gregorian or ethiopian)'
      }
    ]);

    console.log('--- Database Seeding Completed Successfully ---');
    console.log('Default credentials for all users: Username: admin / Password: Admin@123456');
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
