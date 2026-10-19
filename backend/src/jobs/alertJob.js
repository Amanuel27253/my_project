const Inventory = require('../models/Inventory');
const StockLevel = require('../models/StockLevel');
const StockTransfer = require('../models/StockTransfer');
const Alert = require('../models/Alert');
const Setting = require('../models/Setting');

/**
 * Runs rule-based alert scans:
 * 1. Low stock against StockLevel thresholds
 * 2. Expiring batches within warning threshold (default 30 days)
 * 3. Overdue in-transit transfers (default 3 days)
 */
const runAlertScans = async () => {
  console.log('[System Job] Running rule-based alert scans...');
  let alertsCreated = 0;

  try {
    // 1. Expiring Batches Scan
    const expirySetting = await Setting.findOne({ key: 'expiryWarningDays' });
    const warningDays = expirySetting ? Number(expirySetting.value) : 30;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + warningDays);

    const expiringBatches = await Inventory.find({
      status: 'available',
      quantity: { $gt: 0 },
      expiryDate: { $lte: thresholdDate, $gt: new Date() }
    }).populate('locationId goodsId');

    for (const batch of expiringBatches) {
      const existing = await Alert.findOne({
        type: 'expiring',
        refId: batch._id,
        isDismissed: false
      });

      if (!existing && batch.goodsId && batch.locationId) {
        const daysLeft = Math.ceil((batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        await Alert.create({
          type: 'expiring',
          locationId: batch.locationId._id,
          goodsId: batch.goodsId._id,
          refId: batch._id,
          message: `Batch ${batch.batchNumber} of ${batch.goodsId.name} at ${batch.locationId.name} expires in ${daysLeft} days (${batch.expiryDate.toISOString().split('T')[0]}). Remaining: ${batch.quantity} ${batch.goodsId.unit}.`
        });
        alertsCreated++;
      }
    }

    // 2. Overdue In-Transit Transfers Scan
    const overdueSetting = await Setting.findOne({ key: 'transferOverdueDays' });
    const overdueDays = overdueSetting ? Number(overdueSetting.value) : 3;

    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - overdueDays);

    const overdueTransfers = await StockTransfer.find({
      status: 'in_transit',
      dispatchedAt: { $lte: overdueThreshold }
    }).populate('fromLocationId toLocationId');

    for (const transfer of overdueTransfers) {
      const existing = await Alert.findOne({
        type: 'transfer_overdue',
        refId: transfer._id,
        isDismissed: false
      });

      if (!existing && transfer.fromLocationId && transfer.toLocationId) {
        await Alert.create({
          type: 'transfer_overdue',
          locationId: transfer.toLocationId._id,
          refId: transfer._id,
          message: `Transfer ${transfer.transferNo} from ${transfer.fromLocationId.name} to ${transfer.toLocationId.name} dispatched on ${transfer.dispatchedAt.toISOString().split('T')[0]} is overdue for receipt confirmation (> ${overdueDays} days).`
        });
        alertsCreated++;
      }
    }

    // 3. Low Stock Scan
    const stockLevels = await StockLevel.find().populate('locationId goodsId');
    for (const sl of stockLevels) {
      if (!sl.locationId || !sl.goodsId) continue;

      const batches = await Inventory.find({
        locationId: sl.locationId._id,
        goodsId: sl.goodsId._id,
        status: 'available',
        expiryDate: { $gt: new Date() }
      });

      const totalStock = batches.reduce((acc, b) => acc + b.quantity, 0);

      if (totalStock <= sl.minLevel) {
        const existing = await Alert.findOne({
          type: 'low_stock',
          locationId: sl.locationId._id,
          goodsId: sl.goodsId._id,
          isDismissed: false
        });

        if (!existing) {
          await Alert.create({
            type: 'low_stock',
            locationId: sl.locationId._id,
            goodsId: sl.goodsId._id,
            message: `Low stock alert: ${sl.goodsId.name} at ${sl.locationId.name} current stock (${totalStock} ${sl.goodsId.unit}) is at or below threshold (${sl.minLevel} ${sl.goodsId.unit}).`
          });
          alertsCreated++;
        }
      }
    }

    console.log(`[System Job] Alert scans completed. New alerts generated: ${alertsCreated}`);
    return alertsCreated;
  } catch (err) {
    console.error('[System Job] Alert scan error:', err);
    throw err;
  }
};

module.exports = {
  runAlertScans
};
