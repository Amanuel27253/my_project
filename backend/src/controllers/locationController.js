const Location = require('../models/Location');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');

const getLocations = async (req, res) => {
  try {
    const { type, parentId, status } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (parentId) filter.parentId = parentId;
    if (status) filter.status = status;

    const locations = await Location.find(filter)
      .populate('parentId', 'name code type')
      .sort({ type: 1, name: 1 });

    return successResponse(res, locations, 'Locations retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch locations', 500);
  }
};

const getLocationHierarchy = async (req, res) => {
  try {
    const all = await Location.find({ status: 'active' }).lean();
    
    // Group into Zone -> Woredas -> Kebeles
    const zones = all.filter(l => l.type === 'zone');
    const woredas = all.filter(l => l.type === 'woreda');
    const kebeles = all.filter(l => l.type === 'kebele');

    const tree = zones.map(zone => {
      const zoneWoredas = woredas
        .filter(w => w.parentId && w.parentId.toString() === zone._id.toString())
        .map(woreda => {
          const woredaKebeles = kebeles.filter(
            k => k.parentId && k.parentId.toString() === woreda._id.toString()
          );
          return {
            ...woreda,
            kebeles: woredaKebeles
          };
        });

      return {
        ...zone,
        woredas: zoneWoredas
      };
    });

    return successResponse(res, tree, 'Location hierarchy retrieved');
  } catch (err) {
    return errorResponse(res, 'Failed to build location hierarchy', 500);
  }
};

const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate('parentId');
    if (!location) {
      return errorResponse(res, 'Location not found', 404);
    }
    return successResponse(res, location, 'Location retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch location', 500);
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, nameAm, code, type, parentId } = req.body;

    if (!name || !code || !type) {
      return errorResponse(res, 'Location name, code, and type are required', 400);
    }

    if (type !== 'zone' && !parentId) {
      return errorResponse(res, `${type.toUpperCase()} must have a parent office assigned`, 400);
    }

    const existing = await Location.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return errorResponse(res, `Location code ${code} is already in use`, 409);
    }

    const location = await Location.create({
      name: name.trim(),
      nameAm: nameAm ? nameAm.trim() : '',
      code: code.toUpperCase().trim(),
      type,
      parentId: parentId || null
    });

    await logAudit(req, 'LOCATION_CREATE', 'Location', location._id, {
      name: location.name,
      code: location.code,
      type: location.type
    });

    return successResponse(res, location, 'Location created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create location', 500);
  }
};

const updateLocation = async (req, res) => {
  try {
    const { name, nameAm, status, parentId } = req.body;
    const location = await Location.findById(req.params.id);

    if (!location) {
      return errorResponse(res, 'Location not found', 404);
    }

    if (name) location.name = name.trim();
    if (nameAm !== undefined) location.nameAm = nameAm.trim();
    if (status) location.status = status;
    if (parentId !== undefined) location.parentId = parentId;

    await location.save();

    await logAudit(req, 'LOCATION_UPDATE', 'Location', location._id, {
      name: location.name,
      status: location.status
    });

    return successResponse(res, location, 'Location updated successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to update location', 500);
  }
};

module.exports = {
  getLocations,
  getLocationHierarchy,
  getLocationById,
  createLocation,
  updateLocation
};
