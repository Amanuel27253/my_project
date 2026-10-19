const QuotaRule = require('../models/QuotaRule');
const distributionService = require('../services/distributionService');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');

const getQuotaRules = async (req, res) => {
  try {
    const rules = await QuotaRule.find().populate('goodsId');
    return successResponse(res, rules, 'Quota rules retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch quota rules', 500);
  }
};

const upsertQuotaRule = async (req, res) => {
  try {
    const { goodsId, quantityPerPerson, maxPerHousehold, active } = req.body;

    if (!goodsId || quantityPerPerson === undefined || maxPerHousehold === undefined) {
      return errorResponse(res, 'Goods, quantity per person, and max per household are required', 400);
    }

    if (quantityPerPerson <= 0 || maxPerHousehold <= 0) {
      return errorResponse(res, 'Quota quantities must be greater than zero', 400);
    }

    const rule = await QuotaRule.findOneAndUpdate(
      { goodsId },
      {
        quantityPerPerson: Number(quantityPerPerson),
        maxPerHousehold: Number(maxPerHousehold),
        active: active !== undefined ? active : true
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('goodsId');

    await logAudit(req, 'QUOTA_RULE_UPSERT', 'QuotaRule', rule._id, {
      goodsId,
      quantityPerPerson,
      maxPerHousehold
    });

    return successResponse(res, rule, 'Quota rule saved successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to save quota rule', 500);
  }
};

const getBeneficiaryQuota = async (req, res) => {
  try {
    const { periodKey } = req.query;
    const quotaInfo = await distributionService.getBeneficiaryQuotaStatus(
      req.params.beneficiaryId,
      periodKey
    );
    return successResponse(res, quotaInfo, 'Beneficiary quota status retrieved');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fetch beneficiary quota', 500);
  }
};

module.exports = {
  getQuotaRules,
  upsertQuotaRule,
  getBeneficiaryQuota
};
