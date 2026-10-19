const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const StockLevel = require('../models/StockLevel');
const Alert = require('../models/Alert');

/**
 * Receive stock (from supplier or inbound transfer).
 */
const receiveStock = async ({
  locationId,
  goodsId,
  batchNumber,
  quantity,
  expiryDate,
  receivedDate = new Date(),
  refType = 'supplier_receipt',
  refId = null,
  reason = 'Supplier receipt',
  userId,
  session = null
}) => {
  const normBatch = batchNumber.toUpperCase().trim();
  const query = { locationId, goodsId, batchNumber: normBatch };
  const opts = session ? { session } : {};

  let batch = await Inventory.findOne(query).session(session || null);

  let balanceBefore = 0;
  if (batch) {
    balanceBefore = batch.quantity;
    batch.quantity += quantity;
    batch.status = 'available';
    if (expiryDate) batch.expiryDate = expiryDate;
    await batch.save(opts);
  } else {
    const docs = await Inventory.create(
      [
        {
          locationId,
          goodsId,
          batchNumber: normBatch,
          quantity,
          receivedDate,
          expiryDate,
          status: 'available'
        }
      ],
      opts
    );
    batch = docs[0];
  }

  // Calculate new total balance at this office for this good
  const allBatches = await Inventory.find({ locationId, goodsId, status: 'available' }).session(session || null);
  const totalBalance = allBatches.reduce((acc, curr) => acc + curr.quantity, 0);

  // Record StockMovement
  await StockMovement.create(
    [
      {
        type: refType === 'supplier_receipt' ? 'receipt' : 'transfer_in',
        locationId,
        goodsId,
        batchNumber: normBatch,
        expiryDate: batch.expiryDate,
        quantityChange: quantity,
        balanceAfter: totalBalance,
        refType,
        refId,
        reason,
        createdBy: userId
      }
    ],
    opts
  );

  return batch;
};

/**
 * Deduct stock following FEFO (First-Expiry-First-Out).
 * Expired batches are excluded.
 */
const deductStockFEFO = async ({
  locationId,
  goodsId,
  quantityRequired,
  movementType = 'distribution',
  refType = 'distribution',
  refId = null,
  reason = '',
  userId,
  session = null
}) => {
  const now = new Date();
  const opts = session ? { session } : {};

  // Find non-expired available batches ordered by expiry date ASC (FEFO)
  const availableBatches = await Inventory.find({
    locationId,
    goodsId,
    status: 'available',
    quantity: { $gt: 0 },
    expiryDate: { $gt: now }
  })
    .sort({ expiryDate: 1 })
    .session(session || null);

  const totalAvailable = availableBatches.reduce((acc, b) => acc + b.quantity, 0);

  if (totalAvailable < quantityRequired) {
    throw new Error(
      `Insufficient available stock. Required: ${quantityRequired}, Available (non-expired): ${totalAvailable}`
    );
  }

  let remainingToDeduct = quantityRequired;
  const consumedBatches = [];

  for (const batch of availableBatches) {
    if (remainingToDeduct <= 0) break;

    const deductQty = Math.min(batch.quantity, remainingToDeduct);
    batch.quantity -= deductQty;
    remainingToDeduct -= deductQty;

    await batch.save(opts);

    consumedBatches.push({
      batchNumber: batch.batchNumber,
      quantity: deductQty,
      expiryDate: batch.expiryDate
    });

    // Compute updated total balance for goods at this location
    const allBatches = await Inventory.find({ locationId, goodsId, status: 'available' }).session(session || null);
    const balanceAfter = allBatches.reduce((sum, b) => sum + b.quantity, 0);

    await StockMovement.create(
      [
        {
          type: movementType,
          locationId,
          goodsId,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantityChange: -deductQty,
          balanceAfter,
          refType,
          refId,
          reason,
          createdBy: userId
        }
      ],
      opts
    );
  }

  // Check low stock threshold after deduction
  checkLowStock(locationId, goodsId).catch(err => console.error('Low stock check failed:', err));

  return consumedBatches;
};

/**
 * Manual stock adjustment with mandatory reason.
 */
const adjustStock = async ({ locationId, goodsId, batchNumber, newQuantity, reason, userId }) => {
  const batch = await Inventory.findOne({
    locationId,
    goodsId,
    batchNumber: batchNumber.toUpperCase().trim()
  });

  if (!batch) {
    throw new Error(`Batch ${batchNumber} not found at this office`);
  }

  const diff = newQuantity - batch.quantity;
  batch.quantity = newQuantity;
  if (batch.quantity === 0) {
    batch.status = 'written_off';
  } else {
    batch.status = 'available';
  }
  await batch.save();

  const allBatches = await Inventory.find({ locationId, goodsId, status: 'available' });
  const totalBalance = allBatches.reduce((acc, b) => acc + b.quantity, 0);

  await StockMovement.create({
    type: 'adjustment',
    locationId,
    goodsId,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantityChange: diff,
    balanceAfter: totalBalance,
    refType: 'manual_adjustment',
    reason,
    createdBy: userId
  });

  return batch;
};

/**
 * Write off expired or damaged batch.
 */
const writeOffStock = async ({ locationId, goodsId, batchNumber, reason, userId }) => {
  const batch = await Inventory.findOne({
    locationId,
    goodsId,
    batchNumber: batchNumber.toUpperCase().trim()
  });

  if (!batch) {
    throw new Error(`Batch ${batchNumber} not found`);
  }

  const writtenOffQty = batch.quantity;
  batch.quantity = 0;
  batch.status = 'written_off';
  await batch.save();

  const allBatches = await Inventory.find({ locationId, goodsId, status: 'available' });
  const totalBalance = allBatches.reduce((acc, b) => acc + b.quantity, 0);

  await StockMovement.create({
    type: 'write_off',
    locationId,
    goodsId,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantityChange: -writtenOffQty,
    balanceAfter: totalBalance,
    refType: 'write_off',
    reason,
    createdBy: userId
  });

  return batch;
};

/**
 * Checks if stock is below configured minimum level, triggers alert if so.
 */
const checkLowStock = async (locationId, goodsId) => {
  const threshold = await StockLevel.findOne({ locationId, goodsId });
  if (!threshold) return;

  const batches = await Inventory.find({
    locationId,
    goodsId,
    status: 'available',
    expiryDate: { $gt: new Date() }
  });
  const currentStock = batches.reduce((acc, b) => acc + b.quantity, 0);

  if (currentStock <= threshold.minLevel) {
    const existing = await Alert.findOne({
      type: 'low_stock',
      locationId,
      goodsId,
      isDismissed: false
    });

    if (!existing) {
      await Alert.create({
        type: 'low_stock',
        locationId,
        goodsId,
        message: `Low stock alert: Available quantity (${currentStock}) is at or below minimum threshold (${threshold.minLevel}).`
      });
    }
  }
};

module.exports = {
  receiveStock,
  deductStockFEFO,
  adjustStock,
  writeOffStock,
  checkLowStock
};
