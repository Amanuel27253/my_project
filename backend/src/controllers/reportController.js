const Inventory = require('../models/Inventory');
const Distribution = require('../models/Distribution');
const Beneficiary = require('../models/Beneficiary');
const StockMovement = require('../models/StockMovement');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');

const getInventoryReport = async (req, res) => {
  try {
    const { locationId, goodsId } = req.query;
    const filter = { status: 'available' };

    if (locationId) {
      filter.locationId = locationId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) filter.locationId = { $in: accessible };
    }

    if (goodsId) filter.goodsId = goodsId;

    const batches = await Inventory.find(filter)
      .populate('locationId', 'name nameAm code type')
      .populate('goodsId', 'name nameAm category unit')
      .sort({ 'locationId.name': 1, expiryDate: 1 });

    return successResponse(res, batches, 'Inventory report generated');
  } catch (err) {
    return errorResponse(res, 'Failed to generate inventory report', 500);
  }
};

const getDistributionReport = async (req, res) => {
  try {
    const { kebeleId, periodKey, startDate, endDate } = req.query;
    const filter = {};

    if (kebeleId) {
      filter.kebeleId = kebeleId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) filter.kebeleId = { $in: accessible };
    }

    if (periodKey) filter.periodKey = periodKey;

    if (startDate || endDate) {
      filter.distributedAt = {};
      if (startDate) filter.distributedAt.$gte = new Date(startDate);
      if (endDate) filter.distributedAt.$lte = new Date(endDate);
    }

    const distributions = await Distribution.find(filter)
      .populate('beneficiaryId', 'headName idNumber familySize phone')
      .populate('kebeleId', 'name nameAm code')
      .populate('items.goodsId', 'name nameAm unit category')
      .populate('distributedBy', 'fullName username')
      .sort({ distributedAt: -1 });

    // Calculate aggregated totals by good
    const totalsByGoods = {};
    distributions.forEach(d => {
      d.items.forEach(item => {
        if (!item.goodsId) return;
        const name = item.goodsId.name;
        if (!totalsByGoods[name]) {
          totalsByGoods[name] = {
            goodsName: name,
            goodsNameAm: item.goodsId.nameAm,
            unit: item.goodsId.unit,
            totalQuantity: 0
          };
        }
        totalsByGoods[name].totalQuantity += item.quantity;
      });
    });

    return successResponse(res, {
      totalDistributions: distributions.length,
      totalsByGoods: Object.values(totalsByGoods),
      distributions
    }, 'Distribution report generated');
  } catch (err) {
    return errorResponse(res, 'Failed to generate distribution report', 500);
  }
};

const getBeneficiariesReport = async (req, res) => {
  try {
    const { woredaId, kebeleId, status } = req.query;
    const filter = {};

    if (kebeleId) {
      filter.kebeleId = kebeleId;
    } else if (woredaId) {
      filter.woredaId = woredaId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.$or = [{ kebeleId: { $in: accessible } }, { woredaId: { $in: accessible } }];
      }
    }

    if (status) filter.status = status;

    const list = await Beneficiary.find(filter)
      .populate('kebeleId', 'name code')
      .populate('woredaId', 'name code')
      .sort({ createdAt: -1 });

    const totalBeneficiaries = list.length;
    const totalFamilyMembers = list.reduce((sum, b) => sum + (b.familySize || 1), 0);
    const byStatus = {
      registered: list.filter(b => b.status === 'registered').length,
      verified: list.filter(b => b.status === 'verified').length,
      suspended: list.filter(b => b.status === 'suspended').length
    };

    return successResponse(res, {
      summary: {
        totalHouseholds: totalBeneficiaries,
        totalIndividualsServed: totalFamilyMembers,
        byStatus
      },
      beneficiaries: list
    }, 'Beneficiaries report generated');
  } catch (err) {
    return errorResponse(res, 'Failed to generate beneficiaries report', 500);
  }
};

module.exports = {
  getInventoryReport,
  getDistributionReport,
  getBeneficiariesReport
};
