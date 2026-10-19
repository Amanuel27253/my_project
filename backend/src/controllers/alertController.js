const Alert = require('../models/Alert');
const { runAlertScans } = require('../jobs/alertJob');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');

const getAlerts = async (req, res) => {
  try {
    const { type, isDismissed } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (isDismissed !== undefined) {
      filter.isDismissed = isDismissed === 'true';
    } else {
      filter.isDismissed = false;
    }

    const accessible = await getAccessibleLocationIds(req.user);
    if (accessible) {
      filter.$or = [
        { locationId: { $in: accessible } },
        { locationId: null }
      ];
    }

    const alerts = await Alert.find(filter)
      .populate('locationId', 'name nameAm code type')
      .populate('goodsId', 'name nameAm unit')
      .sort({ createdAt: -1 });

    return successResponse(res, alerts, 'Alerts retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch alerts', 500);
  }
};

const dismissAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isDismissed: true },
      { new: true }
    );

    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    return successResponse(res, alert, 'Alert dismissed');
  } catch (err) {
    return errorResponse(res, 'Failed to dismiss alert', 500);
  }
};

const triggerAlertScan = async (req, res) => {
  try {
    const count = await runAlertScans();
    return successResponse(res, { newAlertsGenerated: count }, 'Rule-based alert scan completed');
  } catch (err) {
    return errorResponse(res, 'Failed to run alert scan', 500);
  }
};

module.exports = {
  getAlerts,
  dismissAlert,
  triggerAlertScan
};
