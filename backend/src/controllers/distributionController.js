const Distribution = require('../models/Distribution');
const distributionService = require('../services/distributionService');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

const getDistributions = async (req, res) => {
  try {
    const { kebeleId, beneficiaryId, periodKey, startDate, endDate } = req.query;
    const filter = {};

    if (kebeleId) {
      filter.kebeleId = kebeleId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.kebeleId = { $in: accessible };
      }
    }

    if (beneficiaryId) filter.beneficiaryId = beneficiaryId;
    if (periodKey) filter.periodKey = periodKey;

    if (startDate || endDate) {
      filter.distributedAt = {};
      if (startDate) filter.distributedAt.$gte = new Date(startDate);
      if (endDate) filter.distributedAt.$lte = new Date(endDate);
    }

    const distributions = await Distribution.find(filter)
      .populate('beneficiaryId', 'headName idNumber phone familySize')
      .populate('kebeleId', 'name nameAm code')
      .populate('items.goodsId', 'name nameAm unit category')
      .populate('distributedBy', 'fullName username')
      .sort({ distributedAt: -1 })
      .limit(100);

    return successResponse(res, distributions, 'Distributions retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch distributions', 500);
  }
};

const getDistributionById = async (req, res) => {
  try {
    const distribution = await Distribution.findById(req.params.id)
      .populate('beneficiaryId')
      .populate('kebeleId')
      .populate('items.goodsId')
      .populate('distributedBy', 'fullName username role');

    if (!distribution) {
      return errorResponse(res, 'Distribution record not found', 404);
    }

    return successResponse(res, distribution, 'Distribution record retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch distribution record', 500);
  }
};

const recordDistribution = async (req, res) => {
  try {
    const { beneficiaryId, kebeleId, items } = req.body;

    if (!beneficiaryId || !kebeleId || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Beneficiary, Kebele office, and items array are required', 400);
    }

    const distribution = await distributionService.executeDistribution({
      beneficiaryId,
      kebeleId,
      items,
      userId: req.user._id
    });

    await logAudit(req, 'DISTRIBUTION_EXECUTE', 'Distribution', distribution._id, {
      receiptNo: distribution.receiptNo,
      beneficiaryId,
      kebeleId,
      periodKey: distribution.periodKey,
      itemsCount: items.length
    });

    // Populate for response
    const populated = await Distribution.findById(distribution._id)
      .populate('beneficiaryId')
      .populate('kebeleId')
      .populate('items.goodsId')
      .populate('distributedBy', 'fullName username');

    return successResponse(res, populated, 'Distribution recorded successfully and receipt generated', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to record distribution', 400);
  }
};

const getDistributionReceipt = async (req, res) => {
  try {
    const distribution = await Distribution.findById(req.params.id)
      .populate('beneficiaryId')
      .populate('kebeleId')
      .populate('items.goodsId')
      .populate('distributedBy', 'fullName username');

    if (!distribution) {
      return errorResponse(res, 'Distribution record not found', 404);
    }

    const receipt = {
      receiptNumber: distribution.receiptNo,
      distributionDate: distribution.distributedAt,
      period: distribution.periodKey,
      office: {
        name: distribution.kebeleId.name,
        nameAm: distribution.kebeleId.nameAm,
        code: distribution.kebeleId.code
      },
      beneficiary: {
        headName: distribution.beneficiaryId.headName,
        idType: distribution.beneficiaryId.idType,
        idNumber: distribution.beneficiaryId.idNumber,
        phone: distribution.beneficiaryId.phone,
        familySize: distribution.beneficiaryId.familySize,
        address: distribution.beneficiaryId.address
      },
      items: distribution.items.map(item => ({
        goodsName: item.goodsId.name,
        goodsNameAm: item.goodsId.nameAm,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unit: item.goodsId.unit
      })),
      issuer: {
        name: distribution.distributedBy.fullName,
        username: distribution.distributedBy.username
      },
      verificationNote: 'Official Subsidy Distribution Record — North Shewa Zone Administration'
    };

    return successResponse(res, receipt, 'Receipt generated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to generate receipt', 500);
  }
};

module.exports = {
  getDistributions,
  getDistributionById,
  recordDistribution,
  getDistributionReceipt
};
