const Location = require('../models/Location');
const User = require('../models/User');
const CooperativeStore = require('../models/CooperativeStore');
const Goods = require('../models/Goods');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../middleware/audit');
const { validatePassword } = require('../utils/passwordValidator');

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

/**
 * Auto-suggest next unique code for Woreda, Kebele, or Distributor
 */
const getNextLocationCode = async (req, res) => {
  try {
    const { type, parentId, kebeleId } = req.query;
    if (!type) {
      return errorResponse(res, 'Location type is required', 400);
    }

    if (type === 'woreda') {
      const woredas = await Location.find({ type: 'woreda' }).lean();
      let maxNum = 0;
      for (const w of woredas) {
        const match = (w.code || '').match(/NSZ-W(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      const nextCode = `NSZ-W${String(nextNum).padStart(2, '0')}`;
      return successResponse(res, { nextCode, type }, 'Next Woreda code generated');
    }

    if (type === 'kebele') {
      let woredaId = parentId;
      if (!woredaId && req.user && req.user.locationId) {
        woredaId = req.user.locationId._id || req.user.locationId;
      }
      if (!woredaId) {
        return errorResponse(res, 'Parent Woreda ID is required to generate Kebele code', 400);
      }
      const woreda = await Location.findById(woredaId);
      if (!woreda) {
        return errorResponse(res, 'Parent Woreda not found', 404);
      }

      const woredaCode = woreda.code || 'NSZ-W01';
      const kebeles = await Location.find({ type: 'kebele', parentId: woreda._id }).lean();
      let maxNum = 0;
      const escapedWoredaCode = woredaCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`^${escapedWoredaCode}-K(\\d+)`, 'i');
      for (const k of kebeles) {
        const match = (k.code || '').match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      const nextCode = `${woredaCode}-K${String(nextNum).padStart(2, '0')}`;
      return successResponse(res, { nextCode, parentCode: woredaCode, woredaId: woreda._id }, 'Next Kebele code generated');
    }

    if (type === 'distributor') {
      const targetKebeleId = kebeleId || parentId;
      if (!targetKebeleId) {
        return errorResponse(res, 'Kebele ID is required to generate Distributor code', 400);
      }
      const kebele = await Location.findById(targetKebeleId);
      if (!kebele) {
        return errorResponse(res, 'Kebele not found', 404);
      }
      const nextCode = `DIST-${kebele.code}`;
      return successResponse(res, { nextCode, kebeleCode: kebele.code }, 'Next Distributor code generated');
    }

    return errorResponse(res, 'Unsupported type for code generation', 400);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to generate code', 500);
  }
};

/**
 * Atomic Zone -> Woreda creation + Woreda Officer user provisioning
 */
const createWoredaWithOfficer = async (req, res) => {
  try {
    const {
      name,
      nameAm,
      code,
      adminType = 'RURAL_WOREDA',
      population = 0,
      householdCount = 0,
      officer
    } = req.body;

    if (!name || !code || !officer) {
      return errorResponse(res, 'Woreda name, code, and officer details are required', 400);
    }

    const { fullName, username, password, phone, email } = officer;
    if (!fullName || !username || !password) {
      return errorResponse(res, 'Officer full name, username, and password are required', 400);
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check code collision
    const existingLoc = await Location.findOne({ code: cleanCode });
    if (existingLoc) {
      return errorResponse(res, `Location code '${cleanCode}' is already registered`, 409);
    }

    // Check username collision
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return errorResponse(res, `Username '${cleanUsername}' is already taken`, 409);
    }

    // Validate password
    const validation = validatePassword(password, cleanUsername);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    // Find parent Zone
    let zoneId = null;
    if (req.user && req.user.locationId) {
      const callerLoc = await Location.findById(req.user.locationId._id || req.user.locationId);
      if (callerLoc && callerLoc.type === 'zone') {
        zoneId = callerLoc._id;
      }
    }
    if (!zoneId) {
      const zone = await Location.findOne({ type: 'zone' });
      if (zone) zoneId = zone._id;
    }

    // 1. Create Location
    const woreda = await Location.create({
      name: name.trim(),
      nameAm: nameAm ? nameAm.trim() : '',
      code: cleanCode,
      woredaCode: cleanCode,
      type: 'woreda',
      adminType: adminType || 'RURAL_WOREDA',
      parentId: zoneId,
      population: Number(population) || 0,
      householdCount: Number(householdCount) || 0,
      status: 'active'
    });

    // 2. Hash password & create Woreda Officer user
    const passwordHash = await User.hashPassword(password);
    const newOfficer = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'WOREDA_OFFICER',
      locationId: woreda._id,
      language: 'am',
      mustChangePassword: true,
      createdBy: req.user ? req.user._id : null,
      status: 'active'
    });

    await logAudit(req, 'PROVISION_WOREDA_OFFICER', 'Location', woreda._id, {
      woredaCode: woreda.code,
      woredaName: woreda.name,
      officerUsername: newOfficer.username
    });

    const officerObj = newOfficer.toObject();
    delete officerObj.passwordHash;

    return successResponse(
      res,
      {
        woreda,
        officer: officerObj
      },
      `Woreda '${woreda.name}' (${woreda.code}) and Woreda Officer '${newOfficer.username}' provisioned successfully!`,
      201
    );
  } catch (err) {
    console.error('Error creating woreda with officer:', err);
    return errorResponse(res, err.message || 'Failed to create woreda and officer', 500);
  }
};

/**
 * Atomic Woreda -> Kebele creation + Kebele Officer user provisioning
 */
const createKebeleWithOfficer = async (req, res) => {
  try {
    const {
      name,
      nameAm,
      code,
      woredaId: incomingWoredaId,
      population = 0,
      householdCount = 0,
      gots,
      officer
    } = req.body;

    if (!name || !code || !officer) {
      return errorResponse(res, 'Kebele name, code, and officer details are required', 400);
    }

    const { fullName, username, password, phone, email } = officer;
    if (!fullName || !username || !password) {
      return errorResponse(res, 'Officer full name, username, and password are required', 400);
    }

    // Determine woredaId based on caller role
    const callerRole = (req.user.role || '').toUpperCase();
    const isWoredaOfficer = callerRole === 'WOREDA_OFFICER';
    let woredaId = incomingWoredaId;

    if (isWoredaOfficer) {
      woredaId = req.user.locationId ? (req.user.locationId._id || req.user.locationId) : null;
    }

    if (!woredaId) {
      return errorResponse(res, 'Parent Woreda ID is required', 400);
    }

    const woreda = await Location.findById(woredaId);
    if (!woreda || woreda.type !== 'woreda') {
      return errorResponse(res, 'Valid parent Woreda was not found', 404);
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check code collision
    const existingLoc = await Location.findOne({ code: cleanCode });
    if (existingLoc) {
      return errorResponse(res, `Kebele code '${cleanCode}' is already registered`, 409);
    }

    // Check username collision
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return errorResponse(res, `Username '${cleanUsername}' is already taken`, 409);
    }

    // Validate password
    const validation = validatePassword(password, cleanUsername);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    // Default Got clusters if not provided
    const defaultGots = [
      'Got 01 (መሀል ሰፈር)',
      'Got 02 (አባይ ማዶ)',
      'Got 03 (ወይራ ሰፈር)',
      'Got 04 (ብርሃን ሰፈር)'
    ];

    // 1. Create Kebele Location
    const kebele = await Location.create({
      name: name.trim(),
      nameAm: nameAm ? nameAm.trim() : '',
      code: cleanCode,
      woredaCode: woreda.code,
      type: 'kebele',
      adminType: 'KEBELE',
      parentId: woreda._id,
      population: Number(population) || 0,
      householdCount: Number(householdCount) || 0,
      gots: Array.isArray(gots) && gots.length > 0 ? gots : defaultGots,
      status: 'active'
    });

    // 2. Hash password & create Kebele Officer
    const passwordHash = await User.hashPassword(password);
    const newOfficer = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'KEBELE_OFFICER',
      locationId: kebele._id,
      language: 'am',
      mustChangePassword: true,
      createdBy: req.user._id,
      status: 'active'
    });

    await logAudit(req, 'PROVISION_KEBELE_OFFICER', 'Location', kebele._id, {
      kebeleCode: kebele.code,
      kebeleName: kebele.name,
      woredaCode: woreda.code,
      officerUsername: newOfficer.username
    });

    const officerObj = newOfficer.toObject();
    delete officerObj.passwordHash;

    return successResponse(
      res,
      {
        kebele,
        officer: officerObj
      },
      `Kebele '${kebele.name}' (${kebele.code}) and Officer '${newOfficer.username}' created successfully!`,
      201
    );
  } catch (err) {
    console.error('Error creating kebele with officer:', err);
    return errorResponse(res, err.message || 'Failed to create kebele and officer', 500);
  }
};

/**
 * Atomic Woreda -> Distributor / Cooperative Store creation + Storekeeper user provisioning
 */
const createDistributorWithStorekeeper = async (req, res) => {
  try {
    const {
      name,
      nameAm,
      code,
      kebeleId,
      contactPhone,
      address,
      storekeeper
    } = req.body;

    if (!name || !code || !kebeleId || !storekeeper) {
      return errorResponse(res, 'Distributor name, code, Kebele, and storekeeper details are required', 400);
    }

    const { fullName, username, password, phone, email } = storekeeper;
    if (!fullName || !username || !password) {
      return errorResponse(res, 'Storekeeper full name, username, and password are required', 400);
    }

    const kebele = await Location.findById(kebeleId);
    if (!kebele || kebele.type !== 'kebele') {
      return errorResponse(res, 'Valid Kebele was not found', 404);
    }

    // Boundary check for Woreda Officer
    const callerRole = (req.user.role || '').toUpperCase();
    if (callerRole === 'WOREDA_OFFICER') {
      const callerWoredaId = req.user.locationId ? (req.user.locationId._id || req.user.locationId).toString() : null;
      if (!callerWoredaId || kebele.parentId.toString() !== callerWoredaId) {
        return errorResponse(res, 'Unauthorized: You can only create distributors for Kebeles inside your Woreda', 403);
      }
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check if kebele already has a cooperative store
    const existingForKebele = await CooperativeStore.findOne({ kebeleId: kebele._id });
    if (existingForKebele) {
      return errorResponse(res, `A primary distributor/store already exists for Kebele '${kebele.name}' (${existingForKebele.code})`, 409);
    }

    // Check code collision
    const existingStore = await CooperativeStore.findOne({ code: cleanCode });
    if (existingStore) {
      return errorResponse(res, `Distributor code '${cleanCode}' is already registered`, 409);
    }

    // Check username collision
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return errorResponse(res, `Username '${cleanUsername}' is already taken`, 409);
    }

    // Validate password
    const validation = validatePassword(password, cleanUsername);
    if (!validation.isValid) {
      return errorResponse(res, validation.message, 400);
    }

    // 1. Hash password & create Storekeeper User
    const passwordHash = await User.hashPassword(password);
    const newStorekeeper = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : (contactPhone ? contactPhone.trim() : ''),
      passwordHash,
      role: 'STOREKEEPER',
      locationId: kebele._id,
      language: 'am',
      mustChangePassword: true,
      createdBy: req.user._id,
      status: 'active'
    });

    // 2. Fetch active Goods to initialize stock slots
    const goodsList = await Goods.find({ status: 'active' }).lean();
    const initialStocks = goodsList.map(g => ({
      goodsId: g._id,
      goodsName: g.name,
      goodsNameAm: g.nameAm || '',
      unit: g.unit,
      totalStock: 0,
      lastReceivedAt: null
    }));

    // 3. Create CooperativeStore (Distributor)
    const store = await CooperativeStore.create({
      name: name.trim(),
      nameAm: nameAm ? nameAm.trim() : '',
      code: cleanCode,
      kebeleId: kebele._id,
      woredaId: kebele.parentId,
      storekeeperId: newStorekeeper._id,
      contactPhone: contactPhone ? contactPhone.trim() : (phone ? phone.trim() : ''),
      address: address ? address.trim() : '',
      stocks: initialStocks,
      status: 'active'
    });

    await logAudit(req, 'PROVISION_DISTRIBUTOR_STOREKEEPER', 'CooperativeStore', store._id, {
      distributorCode: store.code,
      distributorName: store.name,
      kebeleCode: kebele.code,
      storekeeperUsername: newStorekeeper.username
    });

    const storekeeperObj = newStorekeeper.toObject();
    delete storekeeperObj.passwordHash;

    return successResponse(
      res,
      {
        distributor: store,
        storekeeper: storekeeperObj
      },
      `Distributor '${store.name}' (${store.code}) and Storekeeper '${newStorekeeper.username}' registered successfully!`,
      201
    );
  } catch (err) {
    console.error('Error creating distributor with storekeeper:', err);
    return errorResponse(res, err.message || 'Failed to create distributor and storekeeper', 500);
  }
};

/**
 * List distributors filtered by woreda or kebele or caller scope
 */
const getDistributors = async (req, res) => {
  try {
    const { woredaId, kebeleId } = req.query;
    const filter = {};

    if (kebeleId) {
      filter.kebeleId = kebeleId;
    } else if (woredaId) {
      filter.woredaId = woredaId;
    } else if (req.user) {
      const callerRole = (req.user.role || '').toUpperCase();
      if (callerRole === 'WOREDA_OFFICER') {
        const callerWoredaId = req.user.locationId ? (req.user.locationId._id || req.user.locationId) : null;
        if (callerWoredaId) filter.woredaId = callerWoredaId;
      } else if (callerRole === 'KEBELE_OFFICER') {
        const callerKebeleId = req.user.locationId ? (req.user.locationId._id || req.user.locationId) : null;
        if (callerKebeleId) filter.kebeleId = callerKebeleId;
      }
    }

    const stores = await CooperativeStore.find(filter)
      .populate('storekeeperId', 'fullName username phone email')
      .populate('kebeleId', 'name nameAm code gots population householdCount')
      .populate('woredaId', 'name nameAm code adminType')
      .sort({ createdAt: -1 });

    return successResponse(res, stores, 'Distributors retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch distributors', 500);
  }
};

module.exports = {
  getLocations,
  getLocationHierarchy,
  getLocationById,
  createLocation,
  updateLocation,
  getNextLocationCode,
  createWoredaWithOfficer,
  createKebeleWithOfficer,
  createDistributorWithStorekeeper,
  getDistributors
};
