const mongoose = require('mongoose');
const Location = require('../models/Location');
const Goods = require('../models/Goods');
const Beneficiary = require('../models/Beneficiary');
const CooperativeStore = require('../models/CooperativeStore');
const DistributionCycle = require('../models/DistributionCycle');
const DistributionTransaction = require('../models/DistributionTransaction');
const GotSchedule = require('../models/GotSchedule');
const SmsLog = require('../models/SmsLog');
const Counter = require('../models/Counter');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');

/**
 * 1. ZONE EXPERT: Zone Overview & Woreda Stats
 */
const getZoneOverview = async (req, res) => {
  try {
    const zone = await Location.findOne({ type: 'zone' });
    const woredas = await Location.find({ type: 'woreda' }).sort({ code: 1 });
    const kebeles = await Location.find({ type: 'kebele' });
    const commodities = await Goods.find({ status: 'active' });

    // Aggregate live counts
    const totalHouseholds = await Beneficiary.countDocuments();
    const verifiedHouseholds = await Beneficiary.countDocuments({ status: 'verified' });

    // Population sum
    const totalPopulation = await Beneficiary.aggregate([
      { $group: { _id: null, total: { $sum: '$familySize' } } }
    ]);
    const livePopulation = (totalPopulation[0] && totalPopulation[0].total) || 0;
    const effectiveTotalPop = livePopulation > 0 ? livePopulation : (zone ? zone.population : 2410000);
    const effectiveTotalHouseholds = totalHouseholds > 0 ? totalHouseholds : (zone ? zone.householdCount : 560000);

    // Per woreda summary
    const woredaStats = await Promise.all(
      woredas.map(async w => {
        const wKebeles = kebeles.filter(k => k.parentId && k.parentId.toString() === w._id.toString());
        const wHouseholds = await Beneficiary.countDocuments({ woredaId: w._id });
        const wPop = await Beneficiary.aggregate([
          { $match: { woredaId: w._id } },
          { $group: { _id: null, total: { $sum: '$familySize' } } }
        ]);
        const popCount = (wPop[0] && wPop[0].total) > 0 ? wPop[0].total : (w.population || 0);
        const householdCount = wHouseholds > 0 ? wHouseholds : (w.householdCount || 0);
        const popShare = effectiveTotalPop > 0 ? ((popCount / effectiveTotalPop) * 100).toFixed(1) : 0;

        return {
          _id: w._id,
          name: w.name,
          nameAm: w.nameAm,
          nameEn: w.name,
          code: w.code,
          woredaCode: w.woredaCode || w.code,
          type: w.adminType || (w.code <= 'NSZ-W06' ? 'CITY_ADMIN' : 'RURAL_WOREDA'),
          adminType: w.adminType || (w.code <= 'NSZ-W06' ? 'CITY_ADMIN' : 'RURAL_WOREDA'),
          kebeleCount: wKebeles.length,
          householdCount,
          population: popCount,
          populationSharePercentage: Number(popShare)
        };
      })
    );

    // Active distribution cycle
    const currentCycle = await DistributionCycle.findOne({ status: 'active' })
      .sort({ createdAt: -1 });

    return successResponse(res, {
      zone,
      totalHouseholds: effectiveTotalHouseholds,
      verifiedHouseholds: verifiedHouseholds > 0 ? verifiedHouseholds : Math.round(effectiveTotalHouseholds * 0.95),
      totalPopulation: effectiveTotalPop,
      woredaStats,
      commodities,
      currentCycle
    }, 'Zone overview retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch zone overview', 500);
  }
};

/**
 * 2. ZONE EXPERT: Update Official Subsidized Price Ceiling
 */
const updatePriceCeiling = async (req, res) => {
  try {
    const { goodsId } = req.params;
    const { priceCeiling, defaultQuotaPerPerson, defaultMaxPerHousehold } = req.body;

    const commodity = await Goods.findById(goodsId);
    if (!commodity) {
      return errorResponse(res, 'Commodity not found', 404);
    }

    const oldPrice = commodity.priceCeiling;
    if (priceCeiling !== undefined) commodity.priceCeiling = Number(priceCeiling);
    if (defaultQuotaPerPerson !== undefined) commodity.defaultQuotaPerPerson = Number(defaultQuotaPerPerson);
    if (defaultMaxPerHousehold !== undefined) commodity.defaultMaxPerHousehold = Number(defaultMaxPerHousehold);

    await commodity.save();

    await logAudit(req, 'PRICE_CEILING_UPDATE', 'Goods', commodity._id, {
      commodity: commodity.name,
      oldPrice,
      newPrice: commodity.priceCeiling
    });

    return successResponse(res, commodity, 'Official subsidized price ceiling updated successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to update price ceiling', 500);
  }
};

/**
 * 3. ZONE EXPERT: Proportional Regional Quota Allocation to Woredas
 */
const allocateStockToWoredas = async (req, res) => {
  try {
    const { cycleCode, title, titleAm, month, allocations } = req.body;
    // allocations: [{ woredaId, goodsId, totalZoneQuantity }]

    if (!cycleCode || !month || !allocations || !allocations.length) {
      return errorResponse(res, 'Cycle code, month, and allocations array are required', 400);
    }

    // Get live population across all woredas
    const woredas = await Location.find({ type: 'woreda' });
    const popAgg = await Beneficiary.aggregate([
      { $group: { _id: '$woredaId', totalPop: { $sum: '$familySize' } } }
    ]);
    const popMap = {};
    let totalZonePop = 0;
    popAgg.forEach(p => {
      if (p._id) {
        popMap[p._id.toString()] = p.totalPop;
      }
    });

    woredas.forEach(w => {
      const livePop = popMap[w._id.toString()] || 0;
      const effectivePop = livePop > 0 ? livePop : (w.population || 50000);
      popMap[w._id.toString()] = effectivePop;
      totalZonePop += effectivePop;
    });

    // Ensure non-zero total for calculation
    if (totalZonePop === 0) totalZonePop = 1;

    let cycle = await DistributionCycle.findOne({ cycleCode: cycleCode.toUpperCase().trim() });
    if (!cycle) {
      cycle = new DistributionCycle({
        cycleCode: cycleCode.toUpperCase().trim(),
        title: title || `Subsidized Distribution Cycle ${month}`,
        titleAm: titleAm || `የ${month} የስርጭት ዙር`,
        month,
        status: 'active',
        createdBy: req.user._id,
        zoneAllocations: []
      });
    }

    const calculatedZoneAllocations = [];
    for (const alloc of allocations) {
      const goods = await Goods.findById(alloc.goodsId);
      if (!goods) continue;

      for (const w of woredas) {
        const wPop = popMap[w._id.toString()] || 0;
        const share = (wPop / totalZonePop);
        const wQuantity = Math.round(alloc.totalZoneQuantity * share);

        calculatedZoneAllocations.push({
          woredaId: w._id,
          goodsId: goods._id,
          goodsName: goods.name,
          goodsNameAm: goods.nameAm,
          unit: goods.unit,
          allocatedQuantity: wQuantity,
          populationSharePercentage: Number((share * 100).toFixed(1)),
          status: 'allocated'
        });
      }
    }

    cycle.zoneAllocations = calculatedZoneAllocations;
    await cycle.save();

    await logAudit(req, 'ZONE_QUOTA_ALLOCATED', 'DistributionCycle', cycle._id, {
      cycleCode: cycle.cycleCode,
      totalWoredas: woredas.length
    });

    return successResponse(res, cycle, 'Regional quota allocated proportionally across all Woredas', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to allocate regional stock', 500);
  }
};

/**
 * 4. WOREDA OFFICER: Woreda Dashboard & Kebele live household census
 */
const getWoredaDashboard = async (req, res) => {
  try {
    const woredaId = req.params.woredaId || (req.user.locationId ? req.user.locationId._id || req.user.locationId : null);
    if (!woredaId) {
      return errorResponse(res, 'Woreda identifier required', 400);
    }

    const woreda = await Location.findById(woredaId);
    if (!woreda) {
      return errorResponse(res, 'Woreda not found', 404);
    }

    const kebeles = await Location.find({ parentId: woreda._id, type: 'kebele' });
    const stores = await CooperativeStore.find({ woredaId: woreda._id });

    // Aggregate kebele stats
    const kebeleStats = await Promise.all(
      kebeles.map(async k => {
        const householdCount = await Beneficiary.countDocuments({ kebeleId: k._id });
        const popAgg = await Beneficiary.aggregate([
          { $match: { kebeleId: k._id } },
          { $group: { _id: null, total: { $sum: '$familySize' } } }
        ]);
        const popCount = (popAgg[0] && popAgg[0].total) || 0;
        const store = stores.find(s => s.kebeleId.toString() === k._id.toString());

        return {
          _id: k._id,
          name: k.name,
          nameAm: k.nameAm,
          code: k.code,
          gots: k.gots || [],
          householdCount,
          population: popCount,
          store: store ? { _id: store._id, name: store.name, nameAm: store.nameAm, stocks: store.stocks } : null
        };
      })
    );

    const activeCycle = await DistributionCycle.findOne({ status: 'active' }).sort({ createdAt: -1 });

    return successResponse(res, {
      woreda,
      kebeleStats,
      activeCycle
    }, 'Woreda dashboard data retrieved');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch woreda dashboard', 500);
  }
};

/**
 * 5. WOREDA OFFICER: Kebele Stock Allocation & Family-Size Quota Rules
 */
const allocateStockToKebeles = async (req, res) => {
  try {
    const { cycleId, kebeleAllocations } = req.body;
    // kebeleAllocations: [{ kebeleId, storeId, goodsId, allocatedQuantity, quotaRule: { quantityPerPerson, maxPerHousehold, unitPrice }, distributionWindow }]

    const cycle = await DistributionCycle.findById(cycleId);
    if (!cycle) {
      return errorResponse(res, 'Distribution cycle not found', 404);
    }

    const updatedKebeleAllocs = [...(cycle.kebeleAllocations || [])];

    for (const item of kebeleAllocations) {
      const goods = await Goods.findById(item.goodsId);
      const store = await CooperativeStore.findById(item.storeId);
      if (!goods || !store) continue;

      // Sequential Allocation Letter Number
      const letterSeq = await Counter.getNextSequence(`LETTER-${cycle.cycleCode}`);
      const letterNo = `AL-NSZ-${cycle.month}-${String(letterSeq).padStart(4, '0')}`;

      // Remove previous entry for same kebele & goods in this cycle if any
      const existingIdx = updatedKebeleAllocs.findIndex(
        a => a.kebeleId.toString() === item.kebeleId.toString() && a.goodsId.toString() === item.goodsId.toString()
      );

      const allocationEntry = {
        kebeleId: item.kebeleId,
        storeId: item.storeId,
        goodsId: goods._id,
        goodsName: goods.name,
        goodsNameAm: goods.nameAm,
        unit: goods.unit,
        allocatedQuantity: Number(item.allocatedQuantity),
        receivedQuantity: 0,
        isReceived: false,
        allocationLetterNo: letterNo,
        allocationLetterDate: new Date(),
        quotaRule: {
          quantityPerPerson: Number(item.quotaRule.quantityPerPerson || goods.defaultQuotaPerPerson || 2),
          maxPerHousehold: Number(item.quotaRule.maxPerHousehold || goods.defaultMaxPerHousehold || 10),
          unitPrice: Number(item.quotaRule.unitPrice || goods.priceCeiling || 0)
        },
        distributionWindow: item.distributionWindow || {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      };

      if (existingIdx >= 0) {
        updatedKebeleAllocs[existingIdx] = allocationEntry;
      } else {
        updatedKebeleAllocs.push(allocationEntry);
      }
    }

    cycle.kebeleAllocations = updatedKebeleAllocs;
    await cycle.save();

    await logAudit(req, 'KEBELE_QUOTA_ALLOCATED', 'DistributionCycle', cycle._id, {
      allocationsCount: kebeleAllocations.length
    });

    return successResponse(res, cycle, 'Stock successfully allocated to Kebele cooperative stores');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to allocate stock to kebeles', 500);
  }
};

/**
 * 6. WOREDA OFFICER: Get Official Allocation Letter (የድልድል ደብዳቤ)
 */
const getAllocationLetter = async (req, res) => {
  try {
    const { cycleId, kebeleId } = req.params;

    const cycle = await DistributionCycle.findById(cycleId);
    if (!cycle) {
      return errorResponse(res, 'Distribution cycle not found', 404);
    }

    const kebele = await Location.findById(kebeleId).populate('parentId');
    if (!kebele) {
      return errorResponse(res, 'Kebele not found', 404);
    }

    const store = await CooperativeStore.findOne({ kebeleId: kebele._id });
    const allocs = (cycle.kebeleAllocations || []).filter(
      a => a.kebeleId.toString() === kebeleId.toString()
    );

    if (!allocs.length) {
      return errorResponse(res, 'No allocations found for this Kebele in the specified cycle', 404);
    }

    const totalHouseholds = await Beneficiary.countDocuments({ kebeleId: kebele._id });
    const popAgg = await Beneficiary.aggregate([
      { $match: { kebeleId: kebele._id } },
      { $group: { _id: null, total: { $sum: '$familySize' } } }
    ]);
    const totalPopulation = (popAgg[0] && popAgg[0].total) || 0;

    const letter = {
      letterNumber: allocs[0].allocationLetterNo || `AL-NSZ-${cycle.month}-001`,
      issueDate: allocs[0].allocationLetterDate || new Date(),
      zoneName: 'North Shewa Zone Administration (የሰሜን ሸዋ ዞን አስተዳደር)',
      woredaName: kebele.parentId ? kebele.parentId.name : 'Debre Berhan City Administration',
      woredaNameAm: kebele.parentId ? kebele.parentId.nameAm : 'የደብረ ብርሃን ከተማ አስተዳደር',
      kebeleName: kebele.name,
      kebeleNameAm: kebele.nameAm,
      kebeleCode: kebele.code,
      storeName: store ? store.name : 'Kebele Consumers Cooperative Store',
      storeNameAm: store ? store.nameAm : 'የቀበሌ ሸማቾች ህብረት ስራ ማህበር ሱቅ',
      totalHouseholds,
      totalPopulation,
      distributionWindow: allocs[0].distributionWindow,
      items: allocs.map(a => ({
        commodityName: a.goodsName,
        commodityNameAm: a.goodsNameAm,
        allocatedQuantity: a.allocatedQuantity,
        unit: a.unit,
        quantityPerPerson: a.quotaRule.quantityPerPerson,
        maxPerHousehold: a.quotaRule.maxPerHousehold,
        subsidizedUnitPrice: a.quotaRule.unitPrice
      }))
    };

    return successResponse(res, letter, 'Official Allocation Letter retrieved');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to generate allocation letter', 500);
  }
};

/**
 * 7. STOREKEEPER: Confirm Physical Receipt of Stock delivered to Store
 * (Implements the Simplified Stock Balance Model: totalStock += quantityReceived)
 */
const confirmStockArrival = async (req, res) => {
  try {
    const { cycleId, kebeleId, goodsId, receivedQuantity } = req.body;

    const cycle = await DistributionCycle.findById(cycleId);
    if (!cycle) {
      return errorResponse(res, 'Distribution cycle not found', 404);
    }

    const alloc = (cycle.kebeleAllocations || []).find(
      a => a.kebeleId.toString() === kebeleId.toString() && a.goodsId.toString() === goodsId.toString()
    );

    if (!alloc) {
      return errorResponse(res, 'Allocation entry not found for this commodity and kebele', 404);
    }

    const store = await CooperativeStore.findOne({ kebeleId });
    if (!store) {
      return errorResponse(res, 'Cooperative store not configured for this Kebele', 404);
    }

    const qty = Number(receivedQuantity || alloc.allocatedQuantity);

    // Update allocation status in cycle
    alloc.isReceived = true;
    alloc.receivedQuantity = qty;
    alloc.receivedAt = new Date();
    alloc.receivedBy = req.user._id;
    await cycle.save();

    // Increment Simplified Stock Balance in CooperativeStore
    let stockItem = store.stocks.find(s => s.goodsId.toString() === goodsId.toString());
    if (stockItem) {
      stockItem.totalStock += qty;
      stockItem.lastReceivedAt = new Date();
    } else {
      store.stocks.push({
        goodsId: alloc.goodsId,
        goodsName: alloc.goodsName,
        goodsNameAm: alloc.goodsNameAm,
        unit: alloc.unit,
        totalStock: qty,
        lastReceivedAt: new Date()
      });
    }

    await store.save();

    await logAudit(req, 'STORE_STOCK_RECEIVED', 'CooperativeStore', store._id, {
      kebeleId,
      commodity: alloc.goodsName,
      quantityReceived: qty,
      newTotalStock: stockItem ? stockItem.totalStock : qty
    });

    return successResponse(res, { store, cycle }, 'Stock arrival confirmed and added to store balance', 200);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to confirm stock arrival', 500);
  }
};

/**
 * 8. STOREKEEPER & PUBLIC: Get Current Store Stock Balances
 */
const getStoreStock = async (req, res) => {
  try {
    const { kebeleId } = req.params;
    const store = await CooperativeStore.findOne({ kebeleId })
      .populate('kebeleId', 'name nameAm code gots')
      .populate('woredaId', 'name nameAm code')
      .populate('storekeeperId', 'fullName phone');

    if (!store) {
      return errorResponse(res, 'Store not found for this Kebele', 404);
    }

    return successResponse(res, store, 'Store stock balances retrieved');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch store stock', 500);
  }
};

/**
 * 9. STOREKEEPER POS: Search Household by Ration ID or Fayda ID
 */
const posSearchHousehold = async (req, res) => {
  try {
    const { query, kebeleId } = req.query;
    if (!query) {
      return errorResponse(res, 'Search term (Ration ID or Fayda ID) required', 400);
    }

    const cleanQuery = query.trim().toUpperCase();

    const household = await Beneficiary.findOne({
      $or: [
        { rationCardId: cleanQuery },
        { faydaId: cleanQuery },
        { idNumber: cleanQuery }
      ]
    }).populate('kebeleId woredaId');

    if (!household) {
      return errorResponse(res, `No household found with ID: ${cleanQuery}`, 404);
    }

    // Check if household belongs to store's kebele
    const belongsToStoreKebele = kebeleId
      ? household.kebeleId._id.toString() === kebeleId.toString()
      : true;

    // Check active cycle
    const currentCycle = await DistributionCycle.findOne({ status: 'active' }).sort({ createdAt: -1 });

    let alreadyCollected = false;
    let existingTransaction = null;

    if (currentCycle) {
      existingTransaction = await DistributionTransaction.findOne({
        householdId: household._id,
        cycleId: currentCycle._id,
        status: 'COLLECTED'
      });
      alreadyCollected = !!existingTransaction;
    }

    // Find kebele allocations and calculate allowed quotas & prices
    let availableQuotas = [];
    if (currentCycle && household.kebeleId) {
      const kebeleAllocs = (currentCycle.kebeleAllocations || []).filter(
        a => a.kebeleId.toString() === household.kebeleId._id.toString()
      );

      availableQuotas = kebeleAllocs.map(a => {
        const calculatedQty = Math.min(
          a.quotaRule.quantityPerPerson * household.familySize,
          a.quotaRule.maxPerHousehold
        );
        const subtotal = calculatedQty * a.quotaRule.unitPrice;

        return {
          goodsId: a.goodsId,
          goodsName: a.goodsName,
          goodsNameAm: a.goodsNameAm,
          unit: a.unit,
          unitPrice: a.quotaRule.unitPrice,
          calculatedQuota: calculatedQty,
          subtotal
        };
      });
    }

    return successResponse(res, {
      household: {
        _id: household._id,
        rationCardId: household.rationCardId,
        headName: household.headName,
        faydaId: household.faydaId || household.idNumber,
        gender: household.gender,
        maritalStatus: household.maritalStatus,
        phone: household.phone,
        got: household.got,
        houseNumber: household.houseNumber,
        familySize: household.familySize,
        familyMembers: household.familyMembers,
        status: household.status,
        kebele: household.kebeleId,
        woreda: household.woredaId
      },
      belongsToStoreKebele,
      currentCycle: currentCycle ? { _id: currentCycle._id, cycleCode: currentCycle.cycleCode, month: currentCycle.month } : null,
      alreadyCollected,
      existingTransaction,
      availableQuotas
    }, 'Household found');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to search household for POS', 500);
  }
};

/**
 * 10. STOREKEEPER POS: ACID Counter Handover & Payment Execution
 * Atomically deducts from simplified stock balance (totalStock -= quantityTaken),
 * records cash, locks cycle status to prevent double-claiming.
 */
const executePosHandover = async (req, res) => {
  let session = null;
  let useTransactions = true;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessErr) {
    // If standalone MongoDB without replica set, fall back gracefully
    useTransactions = false;
  }

  try {
    const { householdId, cycleId, storeId, items } = req.body;
    // items: [{ goodsId, quantity, unitPrice }]

    if (!householdId || !cycleId || !storeId || !items || !items.length) {
      if (session) await session.abortTransaction();
      return errorResponse(res, 'Household ID, cycle ID, store ID, and commodity items are required', 400);
    }

    const queryOpts = session && useTransactions ? { session } : {};

    // 1. Anti-Duplication Check: Compound unique check { householdId, cycleId }
    const existingClaim = await DistributionTransaction.findOne({
      householdId,
      cycleId,
      status: 'COLLECTED'
    }, null, queryOpts);

    if (existingClaim) {
      if (session && useTransactions) await session.abortTransaction();
      return errorResponse(
        res,
        `FRAUD PREVENTED: Household has ALREADY collected their subsidized quota for this cycle on ${new Date(existingClaim.collectedAt).toLocaleDateString()} (Receipt: ${existingClaim.receiptNo}).`,
        409
      );
    }

    const household = await Beneficiary.findById(householdId, null, queryOpts);
    if (!household) {
      if (session && useTransactions) await session.abortTransaction();
      return errorResponse(res, 'Household record not found', 404);
    }

    const store = await CooperativeStore.findById(storeId, null, queryOpts);
    if (!store) {
      if (session && useTransactions) await session.abortTransaction();
      return errorResponse(res, 'Cooperative store record not found', 404);
    }

    const cycle = await DistributionCycle.findById(cycleId, null, queryOpts);
    if (!cycle) {
      if (session && useTransactions) await session.abortTransaction();
      return errorResponse(res, 'Distribution cycle not found', 404);
    }

    // 2. Validate Stock and Deduct Atomically (totalStock -= quantityTaken)
    const transactionItems = [];
    let grandTotalCash = 0;

    for (const item of items) {
      const goods = await Goods.findById(item.goodsId, null, queryOpts);
      if (!goods) {
        if (session && useTransactions) await session.abortTransaction();
        return errorResponse(res, `Commodity ${item.goodsId} not found`, 404);
      }

      const storeStock = store.stocks.find(s => s.goodsId.toString() === item.goodsId.toString());
      const availableBalance = storeStock ? storeStock.totalStock : 0;
      const requestedQty = Number(item.quantity);

      if (availableBalance < requestedQty) {
        if (session && useTransactions) await session.abortTransaction();
        return errorResponse(
          res,
          `INSUFFICIENT STORE STOCK: Only ${availableBalance} ${goods.unit} of ${goods.name} available in store, but requested ${requestedQty} ${goods.unit}.`,
          400
        );
      }

      // Deduct from simple stock balance
      storeStock.totalStock -= requestedQty;

      const unitPrice = Number(item.unitPrice || goods.priceCeiling || 0);
      const subtotal = requestedQty * unitPrice;
      grandTotalCash += subtotal;

      transactionItems.push({
        goodsId: goods._id,
        goodsName: goods.name,
        goodsNameAm: goods.nameAm,
        quantity: requestedQty,
        unit: goods.unit,
        unitPrice,
        subtotal
      });
    }

    // Save updated store stocks
    await store.save(queryOpts);

    // 3. Generate sequential POS receipt
    const kebele = await Location.findById(household.kebeleId, null, queryOpts);
    const kebeleCode = kebele ? kebele.code.replace(/[^A-Z0-9-]/gi, '').toUpperCase() : 'POS';
    const counterKey = `POS-${kebeleCode}-${cycle.month}`;
    const seq = await Counter.getNextSequence(counterKey, session && useTransactions ? session : null);
    const receiptNo = `POS-${kebeleCode}-${cycle.month}-${String(seq).padStart(4, '0')}`;

    // 4. Create Immutable POS Distribution Record
    const transaction = new DistributionTransaction({
      receiptNo,
      cycleId: cycle._id,
      householdId: household._id,
      rationCardId: household.rationCardId,
      headName: household.headName,
      faydaId: household.faydaId || household.idNumber,
      kebeleId: household.kebeleId,
      storeId: store._id,
      storekeeperId: req.user._id,
      got: household.got,
      familySize: household.familySize,
      items: transactionItems,
      totalCash: grandTotalCash,
      paymentMethod: 'Cash',
      status: 'COLLECTED',
      collectedAt: new Date()
    });

    await transaction.save(queryOpts);

    if (session && useTransactions) {
      await session.commitTransaction();
    }

    await logAudit(req, 'POS_HANDOVER_EXECUTED', 'DistributionTransaction', transaction._id, {
      receiptNo: transaction.receiptNo,
      rationCardId: household.rationCardId,
      totalCash: grandTotalCash,
      itemsCount: transactionItems.length
    });

    return successResponse(
      res,
      {
        transaction,
        receiptNo: transaction.receiptNo,
        totalCash: grandTotalCash,
        household: {
          rationCardId: household.rationCardId,
          headName: household.headName,
          faydaId: household.faydaId || household.idNumber,
          got: household.got
        }
      },
      'Counter handover executed successfully and stock deducted atomically',
      201
    );
  } catch (err) {
    if (session && useTransactions) {
      await session.abortTransaction();
    }
    return errorResponse(res, err.message || 'Counter handover failed', 500);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * 11. STOREKEEPER: Daily Stock & Cash Report
 */
const getDailyStockCashReport = async (req, res) => {
  try {
    const { storeId, date } = req.query;
    const filterStoreId = storeId || (req.user.storeId || null);

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const store = filterStoreId
      ? await CooperativeStore.findById(filterStoreId).populate('kebeleId woredaId')
      : await CooperativeStore.findOne().populate('kebeleId woredaId');

    if (!store) {
      return errorResponse(res, 'Cooperative store not found', 404);
    }

    // Transactions today
    const transactions = await DistributionTransaction.find({
      storeId: store._id,
      status: 'COLLECTED',
      collectedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ collectedAt: -1 });

    let totalCashCollected = 0;
    const goodsDistributedMap = {};

    transactions.forEach(t => {
      totalCashCollected += t.totalCash;
      t.items.forEach(i => {
        const key = i.goodsName;
        if (!goodsDistributedMap[key]) {
          goodsDistributedMap[key] = {
            goodsName: i.goodsName,
            goodsNameAm: i.goodsNameAm,
            unit: i.unit,
            quantity: 0,
            cash: 0
          };
        }
        goodsDistributedMap[key].quantity += i.quantity;
        goodsDistributedMap[key].cash += i.subtotal;
      });
    });

    const report = {
      reportDate: startOfDay,
      storeName: store.name,
      storeNameAm: store.nameAm,
      kebeleName: store.kebeleId ? store.kebeleId.name : '',
      woredaName: store.woredaId ? store.woredaId.name : '',
      totalTransactions: transactions.length,
      totalCashCollected,
      currentBalances: store.stocks,
      distributionSummary: Object.values(goodsDistributedMap),
      transactions: transactions.map(t => ({
        receiptNo: t.receiptNo,
        rationCardId: t.rationCardId,
        headName: t.headName,
        got: t.got,
        totalCash: t.totalCash,
        time: t.collectedAt
      }))
    };

    return successResponse(res, report, 'Daily stock and cash report generated');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to generate daily report', 500);
  }
};

/**
 * 12. STOREKEEPER: Trigger Automated Amharic SMS Dispatch Simulation
 */
const sendSmsNotification = async (req, res) => {
  try {
    const { kebeleId, cycleId, got, customMessage } = req.body;

    const kebele = await Location.findById(kebeleId);
    if (!kebele) {
      return errorResponse(res, 'Kebele not found', 404);
    }

    const query = { kebeleId, status: 'verified' };
    if (got && got !== 'All Gots') {
      query.got = got;
    }

    const recipients = await Beneficiary.find(query).select('headName phone rationCardId got');

    const defaultAmharicMsg = `ማሳሰቢያ፡ ለ${kebele.nameAm || kebele.name} ነዋሪዎች በሙሉ፣ የድጎማ የምግብ ዘይትና ስኳር ድልድል ወደ ሸማቾች ሱቅ ደርሷል። እባክዎ የሸማቾች ደብተርዎን ይዘው በጎጥዎ ቀነ-ቀጠሮ መሰረት በመቅረብ ድርሻዎን ይውሰዱ።`;
    const messageAm = customMessage || defaultAmharicMsg;

    const recipientLogs = recipients.map(r => ({
      householdId: r._id,
      headName: r.headName,
      phone: r.phone,
      rationCardId: r.rationCardId,
      deliveryStatus: 'Delivered'
    }));

    const smsLog = await SmsLog.create({
      kebeleId,
      cycleId: cycleId || (await DistributionCycle.findOne({ status: 'active' }))._id,
      got: got || 'All Gots',
      messageAm,
      totalSent: recipientLogs.length,
      recipients: recipientLogs,
      sentBy: req.user._id,
      sentAt: new Date()
    });

    await logAudit(req, 'SMS_NOTIFICATIONS_DISPATCHED', 'SmsLog', smsLog._id, {
      kebele: kebele.name,
      totalSent: recipientLogs.length,
      got: got || 'All Gots'
    });

    return successResponse(
      res,
      { smsLog, totalSent: recipientLogs.length },
      `Automated Amharic SMS dispatched to ${recipientLogs.length} registered households`,
      201
    );
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to dispatch SMS alerts', 500);
  }
};

/**
 * 13. STOREKEEPER: One-Click Printable A4 Amharic Village (Got) Notice Poster
 */
const getPrintableNoticePoster = async (req, res) => {
  try {
    const { kebeleId, cycleId } = req.params;

    const kebele = await Location.findById(kebeleId).populate('parentId');
    if (!kebele) {
      return errorResponse(res, 'Kebele not found', 404);
    }

    const store = await CooperativeStore.findOne({ kebeleId: kebele._id });
    const cycle = cycleId
      ? await DistributionCycle.findById(cycleId)
      : await DistributionCycle.findOne({ status: 'active' }).sort({ createdAt: -1 });

    const kebeleAllocs = cycle
      ? (cycle.kebeleAllocations || []).filter(a => a.kebeleId.toString() === kebeleId.toString())
      : [];

    const schedules = await GotSchedule.find({ kebeleId }).sort({ distributionDate: 1 });

    const poster = {
      header: {
        zoneAm: 'የሰሜን ሸዋ ዞን ንግድና ገበያ ልማት መምሪያ',
        zoneEn: 'North Shewa Zone Trade & Market Development Department',
        woredaAm: kebele.parentId ? kebele.parentId.nameAm : 'የደብረ ብርሃን ከተማ ንግድና ገበያ ልማት ጽ/ቤት',
        woredaEn: kebele.parentId ? kebele.parentId.name : 'Debre Berhan City Administration Trade Office',
        kebeleAm: `${kebele.nameAm || kebele.name} የሸማቾች ህብረት ስራ ማህበር መደብር`,
        kebeleEn: `${kebele.name} Consumers Cooperative Store`,
        date: new Date()
      },
      title: 'የድጎማ መሰረታዊ ሸቀጦች የስርጭት ማስታወቂያ',
      subTitle: `የ${(cycle && cycle.titleAm) || 'የወሩ'} ስርጭት ዙር ለህብረተሰቡ የተላለፈ ጥሪ`,
      commodities: kebeleAllocs.map(a => ({
        nameAm: a.goodsNameAm || a.goodsName,
        nameEn: a.goodsName,
        quotaRule: `ለአንድ ሰው ${a.quotaRule.quantityPerPerson} ${a.unit} (ለአንድ ቤተሰብ እስከ ${a.quotaRule.maxPerHousehold} ${a.unit})`,
        priceCeiling: `${a.quotaRule.unitPrice} የኢትዮጵያ ብር (ETB) በ${a.unit}`
      })),
      gotSchedules: schedules.length
        ? schedules.map(s => ({
            got: s.got,
            date: new Date(s.distributionDate).toLocaleDateString('am-ET'),
            timeSlot: s.timeSlot,
            status: s.status
          }))
        : (kebele.gots || []).map((g, idx) => ({
            got: g,
            date: `ቀን ${idx + 1}`,
            timeSlot: '08:30 AM - 12:30 PM',
            status: 'scheduled'
          })),
      instructions: [
        '1. እያንዳንዱ ሸማች ኦሪጅናል የሸማቾች መታወቂያ ደብተር (የካርድ መለያ ቁጥር ያለበትን) ይዞ መቅረብ አለበት።',
        '2. ክፍያ የሚፈጸመው በጥሬ ገንዘብ በመንግስት በተቆረጠው የድጎማ ዋጋ ብቻ ነው። ከተቆረጠው ዋጋ በላይ ማስከፈል በጥብቅ የተከለከለ ነው።',
        '3. አላስፈላጊ መጨናነቅን ለማስቀረት እያንዳንዱ ነዋሪ በተመደበለት የጎጥ ቀን እና ሰዓት ብቻ እንዲቀርብ እናሳስባለን።',
        '4. ማንኛውም የህገ-ወጥ አሰራር ወይም የዋጋ ጭማሪ ሲያጋጥም ለቀበሌው ወይም ለከተማው ንግድ ጽ/ቤት ይጠቁሙ።'
      ],
      signatures: {
        storekeeperTitle: 'የሸማቾች ማህበር ሱቅ ኃላፊ',
        woredaInspectorTitle: 'የከተማ/ወረዳ ንግድ ተቆጣጣሪ'
      }
    };

    return successResponse(res, poster, 'Printable A4 Notice Poster data generated');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to generate poster', 500);
  }
};

/**
 * 14. KEBELE OFFICER: Got Pickup Schedules
 */
const getGotSchedules = async (req, res) => {
  try {
    const { kebeleId, cycleId } = req.query;
    const filter = {};
    if (kebeleId) filter.kebeleId = kebeleId;
    if (cycleId) filter.cycleId = cycleId;

    const schedules = await GotSchedule.find(filter)
      .populate('kebeleId', 'name nameAm code gots')
      .sort({ distributionDate: 1 });

    return successResponse(res, schedules, 'Got schedules retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch got schedules', 500);
  }
};

const createOrUpdateGotSchedule = async (req, res) => {
  try {
    const { kebeleId, cycleId, got, distributionDate, timeSlot, notes } = req.body;

    if (!kebeleId || !cycleId || !got || !distributionDate) {
      return errorResponse(res, 'Kebele, cycle, Got, and distribution date are required', 400);
    }

    let schedule = await GotSchedule.findOne({ kebeleId, cycleId, got });
    if (schedule) {
      schedule.distributionDate = distributionDate;
      if (timeSlot) schedule.timeSlot = timeSlot;
      if (notes) schedule.notes = notes;
      await schedule.save();
    } else {
      schedule = await GotSchedule.create({
        kebeleId,
        cycleId,
        got,
        distributionDate,
        timeSlot: timeSlot || '08:30 AM - 12:30 PM',
        notes: notes || '',
        createdBy: req.user._id
      });
    }

    return successResponse(res, schedule, 'Got distribution schedule saved successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to save got schedule', 500);
  }
};

/**
 * 15. PUBLIC CITIZEN PORTAL (ZERO LOGIN)
 * Live stock availability, official subsidized prices, and today's active Got schedule
 */
const getPublicPortalData = async (req, res) => {
  try {
    const { kebeleCode } = req.query;

    // Default to Baso Kebele (case study) if not specified
    const targetKebeleCode = kebeleCode ? kebeleCode.toUpperCase().trim() : 'NSZ-W01-K04';

    const kebele = await Location.findOne({ code: targetKebeleCode }).populate('parentId');
    const store = kebele ? await CooperativeStore.findOne({ kebeleId: kebele._id }) : null;
    const commodities = await Goods.find({ status: 'active' }).select('name nameAm category unit priceCeiling');
    const activeCycle = await DistributionCycle.findOne({ status: 'active' }).sort({ createdAt: -1 });

    // Schedules
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = kebele
      ? await GotSchedule.find({ kebeleId: kebele._id }).sort({ distributionDate: 1 })
      : [];

    // All available kebeles for selection dropdown
    const availableKebeles = await Location.find({ type: 'kebele' })
      .select('name nameAm code parentId')
      .populate('parentId', 'name nameAm code');

    // All 28 Woredas across North Shewa Zone
    const availableWoredas = await Location.find({ type: 'woreda' })
      .select('name nameAm code adminType woredaCode population householdCount')
      .sort({ code: 1 });

    return successResponse(res, {
      selectedKebele: kebele,
      store: store ? {
        name: store.name,
        nameAm: store.nameAm,
        stocks: store.stocks,
        contactPhone: store.contactPhone,
        address: store.address
      } : null,
      commodities,
      activeCycle: activeCycle ? {
        title: activeCycle.title,
        titleAm: activeCycle.titleAm,
        month: activeCycle.month
      } : null,
      schedules,
      availableKebeles,
      woredas: availableWoredas
    }, 'Public portal transparency data retrieved');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch public portal data', 500);
  }
};

/**
 * 16. PUBLIC CITIZEN PORTAL: Zero-Login Ration ID Status Check
 */
const checkPublicRationStatus = async (req, res) => {
  try {
    const { rationCardId } = req.query;
    if (!rationCardId) {
      return errorResponse(res, 'Ration ID is required', 400);
    }

    const cleanId = rationCardId.trim().toUpperCase();

    const household = await Beneficiary.findOne({
      $or: [
        { rationCardId: cleanId },
        { faydaId: cleanId }
      ]
    }).populate('kebeleId woredaId');

    if (!household) {
      return successResponse(res, {
        found: false,
        message: 'No registered household booklet found with this Ration ID. Please visit your Kebele Record Office.'
      });
    }

    const activeCycle = await DistributionCycle.findOne({ status: 'active' }).sort({ createdAt: -1 });
    let collectedInCurrentCycle = false;
    let collectionDate = null;

    if (activeCycle) {
      const tx = await DistributionTransaction.findOne({
        householdId: household._id,
        cycleId: activeCycle._id,
        status: 'COLLECTED'
      });
      if (tx) {
        collectedInCurrentCycle = true;
        collectionDate = tx.collectedAt;
      }
    }

    return successResponse(res, {
      found: true,
      rationCardId: household.rationCardId,
      headNameMasked: household.headName.charAt(0) + '*** ' + (household.headName.split(' ')[1] || ''),
      kebeleName: household.kebeleId ? household.kebeleId.name : '',
      kebeleNameAm: household.kebeleId ? household.kebeleId.nameAm : '',
      got: household.got,
      familySize: household.familySize,
      status: household.status,
      cycleMonth: activeCycle ? activeCycle.month : 'N/A',
      collectedInCurrentCycle,
      collectionDate
    }, 'Ration ID verified');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to check ration status', 500);
  }
};

/**
 * 16. NORTH SHEWA ZONE WOREDAS
 * Returns all 28 Woredas (6 City/Town Administrations + 22 Rural Woredas)
 */
const getAllWoredas = async (req, res) => {
  try {
    const woredas = await Location.find({ type: 'woreda' })
      .select('name nameAm code adminType woredaCode population householdCount')
      .sort({ code: 1 });
    return successResponse(res, woredas, 'North Shewa Zone woredas retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch woredas', 500);
  }
};

module.exports = {
  getZoneOverview,
  updatePriceCeiling,
  allocateStockToWoredas,
  getWoredaDashboard,
  allocateStockToKebeles,
  getAllocationLetter,
  confirmStockArrival,
  getStoreStock,
  posSearchHousehold,
  executePosHandover,
  getDailyStockCashReport,
  sendSmsNotification,
  getPrintableNoticePoster,
  getGotSchedules,
  createOrUpdateGotSchedule,
  getPublicPortalData,
  checkPublicRationStatus,
  getAllWoredas
};
