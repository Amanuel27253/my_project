const Goods = require('../models/Goods');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');

const getGoods = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const goods = await Goods.find(filter).sort({ name: 1 });
    return successResponse(res, goods, 'Goods retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch goods', 500);
  }
};

const getGoodById = async (req, res) => {
  try {
    const good = await Goods.findById(req.params.id);
    if (!good) {
      return errorResponse(res, 'Good not found', 404);
    }
    return successResponse(res, good, 'Good retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch good', 500);
  }
};

const createGood = async (req, res) => {
  try {
    const { name, nameAm, category, unit } = req.body;

    if (!name || !unit) {
      return errorResponse(res, 'Good name and unit are required', 400);
    }

    const good = await Goods.create({
      name: name.trim(),
      nameAm: nameAm ? nameAm.trim() : '',
      category: category ? category.trim() : 'Essential',
      unit
    });

    await logAudit(req, 'GOODS_CREATE', 'Goods', good._id, {
      name: good.name,
      unit: good.unit
    });

    return successResponse(res, good, 'Good created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create good', 500);
  }
};

const updateGood = async (req, res) => {
  try {
    const { name, nameAm, category, unit, status } = req.body;
    const good = await Goods.findById(req.params.id);

    if (!good) {
      return errorResponse(res, 'Good not found', 404);
    }

    if (name) good.name = name.trim();
    if (nameAm !== undefined) good.nameAm = nameAm.trim();
    if (category) good.category = category.trim();
    if (unit) good.unit = unit;
    if (status) good.status = status;

    await good.save();

    await logAudit(req, 'GOODS_UPDATE', 'Goods', good._id, {
      name: good.name,
      status: good.status
    });

    return successResponse(res, good, 'Good updated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to update good', 500);
  }
};

module.exports = {
  getGoods,
  getGoodById,
  createGood,
  updateGood
};
