const mongoose = require('mongoose');
const StockRequest = require('../models/StockRequest');
const StockTransfer = require('../models/StockTransfer');
const Location = require('../models/Location');
const Counter = require('../models/Counter');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const inventoryService = require('./inventoryService');

/**
 * Generate sequential numbers.
 */
const generateRequestNo = async (session = null) => {
  const year = new Date().getFullYear();
  const seq = await Counter.getNextSequence(`REQ-${year}`, session);
  return `REQ-${year}-${String(seq).padStart(4, '0')}`;
};

const generateTransferNo = async (session = null) => {
  const year = new Date().getFullYear();
  const seq = await Counter.getNextSequence(`TRF-${year}`, session);
  return `TRF-${year}-${String(seq).padStart(4, '0')}`;
};

/**
 * Create a new stock request.
 * Enforces hierarchical request rule: Kebele -> Woreda, Woreda -> Zone.
 */
const createStockRequest = async ({ fromLocationId, items, userId }) => {
  const fromLocation = await Location.findById(fromLocationId);
  if (!fromLocation) {
    throw new Error('Requesting location not found');
  }

  if (!fromLocation.parentId) {
    throw new Error('Zone level cannot submit a stock request (top level)');
  }

  const toLocationId = fromLocation.parentId;
  const requestNo = await generateRequestNo();

  const formattedItems = items.map(item => ({
    goodsId: item.goodsId,
    quantityRequested: Number(item.quantityRequested),
    quantityApproved: 0
  }));

  const request = await StockRequest.create({
    requestNo,
    fromLocationId,
    toLocationId,
    items: formattedItems,
    status: 'pending',
    requestedBy: userId
  });

  return request;
};

/**
 * Approve or reject a stock request.
 */
const decideStockRequest = async ({ requestId, decision, itemsApproved, decisionNote, userId }) => {
  const request = await StockRequest.findById(requestId);
  if (!request) {
    throw new Error('Stock request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot decide request with status '${request.status}'`);
  }

  if (decision === 'reject') {
    request.status = 'rejected';
    request.decidedBy = userId;
    request.decisionNote = decisionNote || 'Rejected by officer';
    request.decidedAt = new Date();
    await request.save();
    return request;
  }

  if (decision === 'approve') {
    if (itemsApproved && Array.isArray(itemsApproved)) {
      itemsApproved.forEach(appItem => {
        const item = request.items.find(i => i.goodsId.toString() === appItem.goodsId.toString());
        if (item) {
          item.quantityApproved = Number(appItem.quantityApproved);
        }
      });
    } else {
      // Default to full approval if not specified
      request.items.forEach(item => {
        item.quantityApproved = item.quantityRequested;
      });
    }

    request.status = 'approved';
    request.decidedBy = userId;
    request.decisionNote = decisionNote || 'Approved';
    request.decidedAt = new Date();
    await request.save();
    return request;
  }

  throw new Error(`Invalid decision: ${decision}`);
};

/**
 * Dispatch an approved transfer.
 * Deducts stock from supplying office store via FEFO.
 */
const dispatchTransfer = async ({ requestId, fromLocationId, toLocationId, items, userId }) => {
  let request = null;
  if (requestId) {
    request = await StockRequest.findById(requestId);
    if (!request) {
      throw new Error('Referenced stock request not found');
    }
    if (request.status !== 'approved') {
      throw new Error(`Stock request must be 'approved' before dispatch. Current status: ${request.status}`);
    }
  }

  const transferNo = await generateTransferNo();
  const transferItems = [];

  // Deduct items from supplying store via FEFO
  for (const item of items) {
    const consumed = await inventoryService.deductStockFEFO({
      locationId: fromLocationId,
      goodsId: item.goodsId,
      quantityRequired: Number(item.quantitySent),
      movementType: 'transfer_out',
      refType: 'stock_transfer',
      refId: requestId || null,
      reason: `Transfer dispatch ${transferNo}`,
      userId
    });

    for (const c of consumed) {
      transferItems.push({
        goodsId: item.goodsId,
        batchNumber: c.batchNumber,
        expiryDate: c.expiryDate,
        quantitySent: c.quantity,
        quantityReceived: 0
      });
    }
  }

  const transfer = await StockTransfer.create({
    transferNo,
    requestId: requestId || null,
    fromLocationId,
    toLocationId,
    items: transferItems,
    status: 'in_transit',
    dispatchedBy: userId,
    dispatchedAt: new Date()
  });

  if (request) {
    request.status = 'dispatched';
    await request.save();
  }

  return transfer;
};

/**
 * Confirm receipt of transfer.
 * Adds goods into receiving office store. If received != sent, flags discrepancy.
 */
const confirmReceipt = async ({ transferId, receivedItems, discrepancyNote, userId }) => {
  const transfer = await StockTransfer.findById(transferId);
  if (!transfer) {
    throw new Error('Stock transfer not found');
  }

  if (transfer.status !== 'in_transit') {
    throw new Error(`Cannot confirm receipt of transfer with status '${transfer.status}'`);
  }

  let hasDiscrepancy = false;

  for (const receivedItem of receivedItems) {
    const item = transfer.items.find(
      i =>
        i.goodsId.toString() === receivedItem.goodsId.toString() &&
        i.batchNumber === receivedItem.batchNumber
    );

    if (item) {
      item.quantityReceived = Number(receivedItem.quantityReceived);
      if (item.quantityReceived !== item.quantitySent) {
        hasDiscrepancy = true;
      }

      // Add received quantity to destination inventory
      if (item.quantityReceived > 0) {
        await inventoryService.receiveStock({
          locationId: transfer.toLocationId,
          goodsId: item.goodsId,
          batchNumber: item.batchNumber,
          quantity: item.quantityReceived,
          expiryDate: item.expiryDate,
          receivedDate: new Date(),
          refType: 'stock_transfer',
          refId: transfer._id,
          reason: `Transfer received ${transfer.transferNo}`,
          userId
        });
      }
    }
  }

  transfer.status = hasDiscrepancy ? 'received_with_discrepancy' : 'received';
  transfer.receivedBy = userId;
  transfer.receivedAt = new Date();
  if (discrepancyNote) transfer.discrepancyNote = discrepancyNote;

  await transfer.save();

  if (transfer.requestId) {
    await StockRequest.findByIdAndUpdate(transfer.requestId, { status: 'received' });
  }

  // Raise alert if discrepancy
  if (hasDiscrepancy) {
    await Alert.create({
      type: 'discrepancy',
      locationId: transfer.toLocationId,
      refId: transfer._id,
      message: `Stock transfer discrepancy on ${transfer.transferNo}: Sent vs Received mismatch. ${discrepancyNote || ''}`
    });
  }

  return transfer;
};

module.exports = {
  createStockRequest,
  decideStockRequest,
  dispatchTransfer,
  confirmReceipt
};
