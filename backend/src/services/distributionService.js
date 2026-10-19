const mongoose = require('mongoose');
const Distribution = require('../models/Distribution');
const Beneficiary = require('../models/Beneficiary');
const QuotaRule = require('../models/QuotaRule');
const QuotaBalance = require('../models/QuotaBalance');
const Inventory = require('../models/Inventory');
const Location = require('../models/Location');
const Counter = require('../models/Counter');
const Alert = require('../models/Alert');
const inventoryService = require('./inventoryService');

const getCurrentPeriodKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Calculates quota status for a beneficiary in a given period.
 */
const getBeneficiaryQuotaStatus = async (beneficiaryId, periodKey = getCurrentPeriodKey()) => {
  const beneficiary = await Beneficiary.findById(beneficiaryId);
  if (!beneficiary) {
    throw new Error('Beneficiary not found');
  }

  const activeRules = await QuotaRule.find({ active: true }).populate('goodsId');
  const balances = await QuotaBalance.find({ beneficiaryId, periodKey });

  const quotaItems = activeRules.map(rule => {
    const allowed = Math.min(
      rule.quantityPerPerson * beneficiary.familySize,
      rule.maxPerHousehold
    );

    const balanceDoc = balances.find(
      b => b.goodsId.toString() === rule.goodsId._id.toString()
    );

    const used = balanceDoc ? balanceDoc.used : 0;
    const remaining = Math.max(0, allowed - used);

    return {
      goods: rule.goodsId,
      periodKey,
      allowed,
      used,
      remaining,
      quantityPerPerson: rule.quantityPerPerson,
      maxPerHousehold: rule.maxPerHousehold
    };
  });

  return {
    beneficiary,
    periodKey,
    quotas: quotaItems
  };
};

/**
 * Generate sequential receipt number:
 * RC-<KEBELE_CODE>-<PERIOD>-<SEQ>
 */
const generateReceiptNo = async (kebeleId, periodKey, session = null) => {
  const kebele = await Location.findById(kebeleId);
  const kebeleCode = kebele ? kebele.code.replace(/[^A-Z0-9]/gi, '') : 'KEB';
  const counterKey = `RC-${kebeleCode}-${periodKey}`;
  const seq = await Counter.getNextSequence(counterKey, session);
  return `RC-${kebeleCode}-${periodKey}-${String(seq).padStart(4, '0')}`;
};

/**
 * Executes atomic distribution within an ACID transaction:
 * 1. Validates beneficiary status ('verified').
 * 2. Checks and reserves quota balance.
 * 3. Deducts stock from Kebele inventory using FEFO.
 * 4. Creates immutable distribution record and generates receipt.
 */
const executeDistribution = async ({
  beneficiaryId,
  kebeleId,
  items, // [{ goodsId, quantity }]
  userId
}) => {
  const periodKey = getCurrentPeriodKey();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const beneficiary = await Beneficiary.findById(beneficiaryId).session(session);
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    if (beneficiary.status !== 'verified') {
      throw new Error(`Distribution blocked: Beneficiary status is '${beneficiary.status}'. Only 'verified' households can receive goods.`);
    }

    if (beneficiary.kebeleId.toString() !== kebeleId.toString()) {
      throw new Error('Distribution blocked: Beneficiary does not belong to this Kebele office.');
    }

    const distributionItems = [];

    for (const item of items) {
      const goodsId = item.goodsId;
      const requestedQty = Number(item.quantity);

      if (requestedQty <= 0) {
        throw new Error('Quantity to distribute must be greater than zero');
      }

      // Check Quota Rule
      const rule = await QuotaRule.findOne({ goodsId, active: true }).session(session);
      if (!rule) {
        throw new Error('No active quota rule configured for this commodity');
      }

      const allowedTotal = Math.min(
        rule.quantityPerPerson * beneficiary.familySize,
        rule.maxPerHousehold
      );

      // Find or create QuotaBalance
      let balance = await QuotaBalance.findOne({
        beneficiaryId,
        goodsId,
        periodKey
      }).session(session);

      if (!balance) {
        const created = await QuotaBalance.create(
          [
            {
              beneficiaryId,
              goodsId,
              periodKey,
              allowed: allowedTotal,
              used: 0
            }
          ],
          { session }
        );
        balance = created[0];
      }

      const newUsed = balance.used + requestedQty;
      if (newUsed > balance.allowed) {
        // Log alert for quota blocked attempt
        await Alert.create(
          [
            {
              type: 'quota_blocked',
              locationId: kebeleId,
              goodsId,
              refId: beneficiaryId,
              message: `Attempted distribution of ${requestedQty} units to ${beneficiary.headName} exceeds remaining quota of ${balance.allowed - balance.used} units.`
            }
          ],
          { session }
        );

        throw new Error(
          `Distribution exceeds monthly quota. Allowed: ${balance.allowed}, Already used: ${balance.used}, Attempted: ${requestedQty}`
        );
      }

      // Deduct stock via FEFO
      const consumedBatches = await inventoryService.deductStockFEFO({
        locationId: kebeleId,
        goodsId,
        quantityRequired: requestedQty,
        movementType: 'distribution',
        refType: 'distribution',
        reason: `Distribution to ${beneficiary.headName} (${beneficiary.idNumber})`,
        userId,
        session
      });

      for (const c of consumedBatches) {
        distributionItems.push({
          goodsId,
          batchNumber: c.batchNumber,
          quantity: c.quantity
        });
      }

      // Update QuotaBalance
      balance.used = newUsed;
      await balance.save({ session });
    }

    // Generate unique receipt number
    const receiptNo = await generateReceiptNo(kebeleId, periodKey, session);

    const [distribution] = await Distribution.create(
      [
        {
          receiptNo,
          beneficiaryId,
          kebeleId,
          periodKey,
          items: distributionItems,
          distributedBy: userId,
          distributedAt: new Date()
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return distribution;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  getCurrentPeriodKey,
  getBeneficiaryQuotaStatus,
  executeDistribution
};
