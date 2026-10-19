const Beneficiary = require('../models/Beneficiary');
const Location = require('../models/Location');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

const getBeneficiaries = async (req, res) => {
  try {
    const { kebeleId, woredaId, status, search } = req.query;
    const filter = {};

    if (kebeleId) {
      filter.kebeleId = kebeleId;
    } else if (woredaId) {
      filter.woredaId = woredaId;
    } else {
      const accessible = await getAccessibleLocationIds(req.user);
      if (accessible) {
        filter.$or = [
          { kebeleId: { $in: accessible } },
          { woredaId: { $in: accessible } }
        ];
      }
    }

    if (status) filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { headName: searchRegex },
        { idNumber: searchRegex },
        { phone: searchRegex }
      ];
    }

    const beneficiaries = await Beneficiary.find(filter)
      .populate('kebeleId', 'name nameAm code')
      .populate('woredaId', 'name nameAm code')
      .populate('registeredBy', 'fullName username')
      .populate('verifiedBy', 'fullName username')
      .sort({ createdAt: -1 });

    return successResponse(res, beneficiaries, 'Beneficiaries retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch beneficiaries', 500);
  }
};

const getBeneficiaryById = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id)
      .populate('kebeleId')
      .populate('woredaId')
      .populate('registeredBy', 'fullName username')
      .populate('verifiedBy', 'fullName username');

    if (!beneficiary) {
      return errorResponse(res, 'Beneficiary not found', 404);
    }

    return successResponse(res, beneficiary, 'Beneficiary retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch beneficiary', 500);
  }
};

const checkIdAvailability = async (req, res) => {
  try {
    const { idNumber } = req.query;
    if (!idNumber) {
      return errorResponse(res, 'ID number is required', 400);
    }

    const existing = await Beneficiary.findOne({ idNumber: idNumber.toUpperCase().trim() })
      .populate('kebeleId', 'name');

    if (existing) {
      return successResponse(res, {
        available: false,
        message: `ID is already registered to ${existing.headName} in ${existing.kebeleId ? existing.kebeleId.name : 'another kebele'}`
      });
    }

    return successResponse(res, { available: true, message: 'ID number is available' });
  } catch (err) {
    return errorResponse(res, 'Failed to check ID availability', 500);
  }
};

const registerBeneficiary = async (req, res) => {
  try {
    const { headName, gender, idType, idNumber, phone, address, kebeleId, familySize } = req.body;

    if (!headName || !gender || !idNumber || !phone || !kebeleId || !familySize) {
      return errorResponse(res, 'Head name, gender, ID number, phone, Kebele, and family size are required', 400);
    }

    const normIdNumber = idNumber.toUpperCase().trim();

    // Check system-wide unique ID number
    const existingWithId = await Beneficiary.findOne({ idNumber: normIdNumber });
    if (existingWithId) {
      return errorResponse(
        res,
        `Duplicate registration rejected: ID ${normIdNumber} is already registered system-wide.`,
        409
      );
    }

    // Resolve parent Woreda
    const kebele = await Location.findById(kebeleId);
    if (!kebele || kebele.type !== 'kebele') {
      return errorResponse(res, 'Invalid Kebele office selected', 400);
    }
    const woredaId = kebele.parentId;

    // Check soft warning: matching name + phone in the same Kebele
    const softDuplicate = await Beneficiary.findOne({
      kebeleId,
      headName: new RegExp(`^${headName.trim()}$`, 'i'),
      phone: phone.trim()
    });

    const warning = softDuplicate
      ? `Warning: Another household with name '${headName}' and phone '${phone}' already exists in this Kebele.`
      : null;

    const beneficiary = await Beneficiary.create({
      headName: headName.trim(),
      gender,
      idType: idType || 'kebele',
      idNumber: normIdNumber,
      phone: phone.trim(),
      address: address ? address.trim() : '',
      kebeleId,
      woredaId,
      familySize: Number(familySize),
      status: 'registered',
      registeredBy: req.user._id
    });

    await logAudit(req, 'BENEFICIARY_REGISTER', 'Beneficiary', beneficiary._id, {
      headName: beneficiary.headName,
      idNumber: beneficiary.idNumber,
      kebeleId: beneficiary.kebeleId
    });

    return successResponse(res, { beneficiary, warning }, 'Beneficiary registered successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to register beneficiary', 500);
  }
};

const verifyBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return errorResponse(res, 'Beneficiary not found', 404);
    }

    beneficiary.status = 'verified';
    beneficiary.verifiedBy = req.user._id;
    beneficiary.verifiedAt = new Date();
    await beneficiary.save();

    await logAudit(req, 'BENEFICIARY_VERIFY', 'Beneficiary', beneficiary._id, {
      headName: beneficiary.headName,
      idNumber: beneficiary.idNumber
    });

    return successResponse(res, beneficiary, 'Beneficiary verified successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to verify beneficiary', 500);
  }
};

const suspendBeneficiary = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return errorResponse(res, 'Suspension reason is required', 400);
    }

    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return errorResponse(res, 'Beneficiary not found', 404);
    }

    beneficiary.status = 'suspended';
    beneficiary.suspendReason = reason;
    await beneficiary.save();

    await logAudit(req, 'BENEFICIARY_SUSPEND', 'Beneficiary', beneficiary._id, {
      headName: beneficiary.headName,
      reason
    });

    return successResponse(res, beneficiary, 'Beneficiary suspended successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to suspend beneficiary', 500);
  }
};

module.exports = {
  getBeneficiaries,
  getBeneficiaryById,
  checkIdAvailability,
  registerBeneficiary,
  verifyBeneficiary,
  suspendBeneficiary
};
