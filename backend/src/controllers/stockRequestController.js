const StockRequest = require('../models/StockRequest');
const requestTransferService = require('../services/requestTransferService');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

const getStockRequests = async (req, res) => {
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

    const requests = await StockRequest.find(filter)
      .populate('fromLocationId', 'name nameAm code type')
      .populate('toLocationId', 'name nameAm code type')
      .populate('items.goodsId', 'name nameAm unit category')
      .populate('requestedBy', 'fullName username role')
      .populate('decidedBy', 'fullName username role')
      .sort({ createdAt: -1 });

    return successResponse(res, requests, 'Stock requests retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stock requests', 500);
  }
};

const getStockRequestById = async (req, res) => {
  try {
    const request = await StockRequest.findById(req.params.id)
      .populate('fromLocationId')
      .populate('toLocationId')
      .populate('items.goodsId')
      .populate('requestedBy', 'fullName username role')
      .populate('decidedBy', 'fullName username role');

    if (!request) {
      return errorResponse(res, 'Stock request not found', 404);
    }

    return successResponse(res, request, 'Stock request retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stock request', 500);
  }
};

const createStockRequest = async (req, res) => {
  try {
    const { fromLocationId, items } = req.body;

    if (!fromLocationId || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Requesting location and items array are required', 400);
    }

    const request = await requestTransferService.createStockRequest({
      fromLocationId,
      items,
      userId: req.user._id
    });

    await logAudit(req, 'STOCK_REQUEST_CREATE', 'StockRequest', request._id, {
      requestNo: request.requestNo,
      fromLocationId: request.fromLocationId,
      toLocationId: request.toLocationId
    });

    return successResponse(res, request, 'Stock request created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create stock request', 500);
  }
};

const decideStockRequest = async (req, res) => {
  try {
    const { decision, itemsApproved, decisionNote } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return errorResponse(res, "Decision must be 'approve' or 'reject'", 400);
    }

    const request = await requestTransferService.decideStockRequest({
      requestId: req.params.id,
      decision,
      itemsApproved,
      decisionNote,
      userId: req.user._id
    });

    await logAudit(req, `STOCK_REQUEST_${decision.toUpperCase()}`, 'StockRequest', request._id, {
      requestNo: request.requestNo,
      decision,
      decisionNote
    });

    return successResponse(res, request, `Stock request ${decision}d successfully`);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to decide stock request', 500);
  }
};

const cancelStockRequest = async (req, res) => {
  try {
    const request = await StockRequest.findById(req.params.id);
    if (!request) {
      return errorResponse(res, 'Stock request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, `Cannot cancel request with status '${request.status}'`, 400);
    }

    request.status = 'cancelled';
    await request.save();

    await logAudit(req, 'STOCK_REQUEST_CANCEL', 'StockRequest', request._id, {
      requestNo: request.requestNo
    });

    return successResponse(res, request, 'Stock request cancelled successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to cancel stock request', 500);
  }
};

module.exports = {
  getStockRequests,
  getStockRequestById,
  createStockRequest,
  decideStockRequest,
  cancelStockRequest
};
