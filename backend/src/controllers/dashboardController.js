const Inventory = require('../models/Inventory');
const Beneficiary = require('../models/Beneficiary');
const StockRequest = require('../models/StockRequest');
const StockTransfer = require('../models/StockTransfer');
const Distribution = require('../models/Distribution');
const Alert = require('../models/Alert');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');

const getDashboardSummary = async (req, res) => {
  try {
    const accessible = await getAccessibleLocationIds(req.user);
    const locFilter = accessible ? { locationId: { $in: accessible } } : {};
    const officeFilter = accessible ? { $in: accessible } : null;

    // 1. Stock overview
    const inventoryBatches = await Inventory.find({
      ...locFilter,
      status: 'available',
      expiryDate: { $gt: new Date() }
    }).populate('goodsId');

    const totalStockByGoods = {};
    inventoryBatches.forEach(b => {
      if (!b.goodsId) return;
      const key = b.goodsId.name;
      if (!totalStockByGoods[key]) {
        totalStockByGoods[key] = {
          name: b.goodsId.name,
          nameAm: b.goodsId.nameAm,
          unit: b.goodsId.unit,
          quantity: 0
        };
      }
      totalStockByGoods[key].quantity += b.quantity;
    });

    // 2. Beneficiaries count
    const benFilter = {};
    if (officeFilter) {
      benFilter.$or = [{ kebeleId: officeFilter }, { woredaId: officeFilter }];
    }
    const [totalBeneficiaries, verifiedBeneficiaries] = await Promise.all([
      Beneficiary.countDocuments(benFilter),
      Beneficiary.countDocuments({ ...benFilter, status: 'verified' })
    ]);

    // 3. Pending requests
    const reqFilter = { status: 'pending' };
    if (officeFilter) {
      reqFilter.$or = [{ fromLocationId: officeFilter }, { toLocationId: officeFilter }];
    }
    const pendingRequestsCount = await StockRequest.countDocuments(reqFilter);

    // 4. In-transit transfers
    const trfFilter = { status: 'in_transit' };
    if (officeFilter) {
      trfFilter.$or = [{ fromLocationId: officeFilter }, { toLocationId: officeFilter }];
    }
    const inTransitTransfersCount = await StockTransfer.countDocuments(trfFilter);

    // 5. Active alerts
    const alertFilter = { isDismissed: false };
    if (officeFilter) {
      alertFilter.locationId = officeFilter;
    }
    const [activeAlertsCount, recentAlerts] = await Promise.all([
      Alert.countDocuments(alertFilter),
      Alert.find(alertFilter)
        .populate('locationId', 'name code')
        .populate('goodsId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // 6. Recent distributions (this month)
    const d = new Date();
    const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const distFilter = { periodKey };
    if (officeFilter) {
      distFilter.kebeleId = officeFilter;
    }
    const monthlyDistributionsCount = await Distribution.countDocuments(distFilter);

    return successResponse(res, {
      role: req.user.role,
      userOffice: req.user.locationId ? req.user.locationId.name : 'System-Wide',
      currentPeriod: periodKey,
      metrics: {
        totalStockByGoods: Object.values(totalStockByGoods),
        totalBeneficiaries,
        verifiedBeneficiaries,
        pendingRequestsCount,
        inTransitTransfersCount,
        activeAlertsCount,
        monthlyDistributionsCount
      },
      recentAlerts
    }, 'Dashboard metrics retrieved');
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse(res, 'Failed to fetch dashboard metrics', 500);
  }
};

module.exports = {
  getDashboardSummary
};
