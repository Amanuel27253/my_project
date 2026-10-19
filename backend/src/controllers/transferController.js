const StockTransfer = require('../models/StockTransfer');
const requestTransferService = require('../services/requestTransferService');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

const getTransfers = async (req, res) => {
  try {
    const { status, fromLocationId, toLocationId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (fromLocationId) filter.fromLocationId = fromLocationId;
    if (toLocationId) filter.toLocationId = toLocationId;

    if (!fromLocationId && !toLocationId) {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.$or = [
          { fromLocationId: { $in: accessible } },
          { toLocationId: { $in: accessible } }
        ];
      }
    }

    const transfers = await StockTransfer.find(filter)
      .populate('fromLocationId', 'name nameAm code type')
      .populate('toLocationId', 'name nameAm code type')
      .populate('items.goodsId', 'name nameAm unit category')
      .populate('dispatchedBy', 'fullName username role')
      .populate('receivedBy', 'fullName username role')
      .sort({ createdAt: -1 });

    return successResponse(res, transfers, 'Stock transfers retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch transfers', 500);
  }
};

const getTransferById = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
      .populate('fromLocationId')
      .populate('toLocationId')
      .populate('items.goodsId')
      .populate('dispatchedBy', 'fullName username role')
      .populate('receivedBy', 'fullName username role');

    if (!transfer) {
      return errorResponse(res, 'Stock transfer not found', 404);
    }

    return successResponse(res, transfer, 'Stock transfer retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stock transfer', 500);
  }
};

const dispatchTransfer = async (req, res) => {
  try {
    const { requestId, fromLocationId, toLocationId, items } = req.body;

    if (!fromLocationId || !toLocationId || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Origin location, destination location, and items array are required', 400);
    }

    const transfer = await requestTransferService.dispatchTransfer({
      requestId,
      fromLocationId,
      toLocationId,
      items,
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_TRANSFER_DISPATCH', 'StockTransfer', transfer._id, {
      transferNo: transfer.transferNo,
      fromLocationId,
      toLocationId,
      itemsCount: transfer.items.length
    });

    return successResponse(res, transfer, 'Stock transfer dispatched successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to dispatch stock transfer', 500);
  }
};

const confirmReceipt = async (req, res) => {
  try {
    const { receivedItems, discrepancyNote } = req.body;

    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
      return errorResponse(res, 'Received items array is required', 400);
    }

    const transfer = await requestTransferService.confirmReceipt({
      transferId: req.params.id,
      receivedItems,
      discrepancyNote,
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_TRANSFER_RECEIVE', 'StockTransfer', transfer._id, {
      transferNo: transfer.transferNo,
      status: transfer.status,
      discrepancyNote
    });

    return successResponse(res, transfer, 'Stock transfer receipt confirmed successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to confirm stock transfer receipt', 500);
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  dispatchTransfer,
  confirmReceipt
};
