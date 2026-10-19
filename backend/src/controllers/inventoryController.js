const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const StockLevel = require('../models/StockLevel');
const inventoryService = require('../services/inventoryService');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

const getInventory = async (req, res) => {
  try {
    const { locationId, goodsId, status } = req.query;
    const filter = {};

    if (locationId) {
      filter.locationId = locationId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.locationId = { $in: accessible };
      }
    }

    if (goodsId) filter.goodsId = goodsId;
    if (status) filter.status = status;

    const inventory = await Inventory.find(filter)
      .populate('locationId', 'name nameAm code type')
      .populate('goodsId', 'name nameAm category unit')
      .sort({ expiryDate: 1 });

    return successResponse(res, inventory, 'Inventory retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch inventory', 500);
  }
};

const receiveSupplierStock = async (req, res) => {
  try {
    const { locationId, goodsId, batchNumber, quantity, expiryDate, receivedDate } = req.body;

    if (!locationId || !goodsId || !batchNumber || !quantity || !expiryDate) {
      return errorResponse(res, 'Location, goods, batch number, quantity, and expiry date are required', 400);
    }

    if (quantity <= 0) {
      return errorResponse(res, 'Quantity must be greater than zero', 400);
    }

    const expiry = new Date(expiryDate);
    if (expiry <= new Date()) {
      return errorResponse(res, 'Expiry date must be in the future', 400);
    }

    const batch = await inventoryService.receiveStock({
      locationId,
      goodsId,
      batchNumber,
      quantity: Number(quantity),
      expiryDate: expiry,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      refType: 'supplier_receipt',
      reason: 'Direct supplier delivery',
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_RECEIVE', 'Inventory', batch._id, {
      locationId,
      goodsId,
      batchNumber,
      quantity
    });

    return successResponse(res, batch, 'Stock received successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to receive stock', 500);
  }
};

const adjustStock = async (req, res) => {
  try {
    const { locationId, goodsId, batchNumber, newQuantity, reason } = req.body;

    if (!locationId || !goodsId || !batchNumber || newQuantity === undefined || !reason) {
      return errorResponse(res, 'Location, goods, batch number, new quantity, and a mandatory reason are required', 400);
    }

    if (newQuantity < 0) {
      return errorResponse(res, 'Quantity cannot be negative', 400);
    }

    const updated = await inventoryService.adjustStock({
      locationId,
      goodsId,
      batchNumber,
      newQuantity: Number(newQuantity),
      reason,
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_ADJUSTMENT', 'Inventory', updated._id, {
      locationId,
      goodsId,
      batchNumber,
      newQuantity,
      reason
    });

    return successResponse(res, updated, 'Stock adjusted successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to adjust stock', 500);
  }
};

const writeOffStock = async (req, res) => {
  try {
    const { locationId, goodsId, batchNumber, reason } = req.body;

    if (!locationId || !goodsId || !batchNumber || !reason) {
      return errorResponse(res, 'Location, goods, batch number, and reason are required', 400);
    }

    const updated = await inventoryService.writeOffStock({
      locationId,
      goodsId,
      batchNumber,
      reason,
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_WRITE_OFF', 'Inventory', updated._id, {
      locationId,
      goodsId,
      batchNumber,
      reason
    });

    return successResponse(res, updated, 'Stock written off successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to write off stock', 500);
  }
};

const getExpiringBatches = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const filter = {
      status: 'available',
      quantity: { $gt: 0 },
      expiryDate: { $lte: targetDate, $gt: new Date() }
    };

    if (req.query.locationId) {
      filter.locationId = req.query.locationId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.locationId = { $in: accessible };
      }
    }

    const expiring = await Inventory.find(filter)
      .populate('locationId', 'name nameAm code type')
      .populate('goodsId', 'name nameAm category unit')
      .sort({ expiryDate: 1 });

    return successResponse(res, expiring, `Batches expiring within ${days} days retrieved`);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch expiring batches', 500);
  }
};

const getStockMovements = async (req, res) => {
  try {
    const { locationId, goodsId, type, startDate, endDate } = req.query;
    const filter = {};

    if (locationId) {
      filter.locationId = locationId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.locationId = { $in: accessible };
      }
    }

    if (goodsId) filter.goodsId = goodsId;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(filter)
      .populate('locationId', 'name code type')
      .populate('goodsId', 'name unit')
      .populate('createdBy', 'fullName username role')
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse(res, movements, 'Stock movements retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stock movements', 500);
  }
};

const getStockLevels = async (req, res) => {
  try {
    const { locationId } = req.query;
    const filter = {};
    if (locationId) filter.locationId = locationId;

    const levels = await StockLevel.find(filter)
      .populate('locationId', 'name code type')
      .populate('goodsId', 'name unit');

    return successResponse(res, levels, 'Stock thresholds retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stock thresholds', 500);
  }
};

const setStockLevel = async (req, res) => {
  try {
    const { locationId, goodsId, minLevel } = req.body;

    if (!locationId || !goodsId || minLevel === undefined) {
      return errorResponse(res, 'Location, goods, and min level are required', 400);
    }

    const level = await StockLevel.findOneAndUpdate(
      { locationId, goodsId },
      { minLevel: Number(minLevel) },
      { new: true, upsert: true }
    );

    return successResponse(res, level, 'Stock threshold updated');
  } catch (err) {
    return errorResponse(res, 'Failed to set stock threshold', 500);
  }
};

module.exports = {
  getInventory,
  receiveSupplierStock,
  adjustStock,
  writeOffStock,
  getExpiringBatches,
  getStockMovements,
  getStockLevels,
  setStockLevel
};
