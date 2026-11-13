const Beneficiary = require('../models/Beneficiary');
const Location = require('../models/Location');
const Counter = require('../models/Counter');
const { successResponse, errorResponse } = require('../utils/response');
const { getAccessibleLocationIds } = require('../utils/locationScope');
const { logAudit } = require('../middleware/audit');

/**
 * Helper to check whether any ID (Fayda or Kebele ID or Dependent ID)
 * exists anywhere in the North Shewa Zone system.
 */
const checkGlobalIdCollision = async (idValue, excludeHouseholdId = null) => {
  if (!idValue) return null;
  const cleanId = idValue.trim().toUpperCase();

  // 1. Check if ID matches any Household Head faydaId or idNumber
  const headMatch = await Beneficiary.findOne({
    _id: { $ne: excludeHouseholdId },
    $or: [
      { faydaId: cleanId },
      { idNumber: cleanId }
    ]
  }).populate('kebeleId woredaId');

  if (headMatch) {
    return {
      type: 'HEAD_COLLISION',
      id: cleanId,
      headName: headMatch.headName,
      rationCardId: headMatch.rationCardId,
      kebeleName: headMatch.kebeleId ? headMatch.kebeleId.name : 'Unknown Kebele',
      kebeleCode: headMatch.kebeleId ? headMatch.kebeleId.code : 'Unknown',
      woredaName: headMatch.woredaId ? headMatch.woredaId.name : 'Unknown Woreda'
    };
  }

  // 2. Check if ID matches any Dependent in any familyMembers[]
  const depMatch = await Beneficiary.findOne({
    _id: { $ne: excludeHouseholdId },
    'familyMembers.faydaOrBirthId': cleanId
  }).populate('kebeleId woredaId');

  if (depMatch) {
    const member = depMatch.familyMembers.find(
      m => m.faydaOrBirthId && m.faydaOrBirthId.toUpperCase() === cleanId
    );
    return {
      type: 'DEPENDENT_COLLISION',
      id: cleanId,
      memberName: member ? member.name : 'Registered Dependent',
      headName: depMatch.headName,
      rationCardId: depMatch.rationCardId,
      kebeleName: depMatch.kebeleId ? depMatch.kebeleId.name : 'Unknown Kebele',
      kebeleCode: depMatch.kebeleId ? depMatch.kebeleId.code : 'Unknown',
      woredaName: depMatch.woredaId ? depMatch.woredaId.name : 'Unknown Woreda'
    };
  }

  return null;
};

const getBeneficiaries = async (req, res) => {
  try {
    const { kebeleId, woredaId, status, search, got } = req.query;
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
    if (got) filter.got = got;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { headName: searchRegex },
        { faydaId: searchRegex },
        { idNumber: searchRegex },
        { rationCardId: searchRegex },
        { phone: searchRegex }
      ];
    }

    const beneficiaries = await Beneficiary.find(filter)
      .populate('kebeleId', 'name nameAm code gots')
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
    const { idNumber, faydaId, excludeId } = req.query;
    const targetId = faydaId || idNumber;
    if (!targetId) {
      return errorResponse(res, 'ID number or Fayda ID is required', 400);
    }

    const collision = await checkGlobalIdCollision(targetId, excludeId || null);

    if (collision) {
      const msg =
        collision.type === 'HEAD_COLLISION'
          ? `National ID (${collision.id}) is already registered as Household Head to "${collision.headName}" [Ration ID: ${collision.rationCardId || 'N/A'}] in ${collision.kebeleName} (${collision.kebeleCode}), Woreda: ${collision.woredaName}.`
          : `National/Birth ID (${collision.id}) is already registered as a dependent ("${collision.memberName}") under Household Head "${collision.headName}" [Ration ID: ${collision.rationCardId || 'N/A'}] in ${collision.kebeleName} (${collision.kebeleCode}), Woreda: ${collision.woredaName}.`;

      return successResponse(res, {
        available: false,
        collision,
        message: msg
      });
    }

    return successResponse(res, { available: true, message: 'ID number is available across North Shewa Zone' });
  } catch (err) {
    return errorResponse(res, 'Failed to check ID availability', 500);
  }
};

const registerBeneficiary = async (req, res) => {
  try {
    const {
      headName,
      gender,
      maritalStatus,
      idType,
      idNumber,
      faydaId,
      phone,
      got,
      houseNumber,
      address,
      kebeleId,
      familyMembers = []
    } = req.body;

    // Use faydaId if provided, else fall back to idNumber
    const primaryFayda = (faydaId || idNumber || '').trim();

    if (!headName || !gender || !primaryFayda || !phone || !kebeleId) {
      return errorResponse(
        res,
        'Household head name, gender, Fayda/National ID, phone number, and Kebele office are required',
        400
      );
    }

    const isFayda = idType === 'fayda' || /^\d{12}$/.test(primaryFayda);

    // Validate 12-digit format if it is purely numeric
    if (/^\d+$/.test(primaryFayda) && primaryFayda.length !== 12) {
      return errorResponse(
        res,
        'Ethiopian National ID (Fayda / ፋይዳ) must consist of exactly 12 numeric digits (e.g. 123456789012).',
        400
      );
    }

    // 1. Check Global Uniqueness for Household Head
    const headCollision = await checkGlobalIdCollision(primaryFayda);
    if (headCollision) {
      await logAudit(req, 'FRAUD_DUPLICATE_HEAD_BLOCKED', 'Beneficiary', null, {
        attemptedFayda: primaryFayda,
        attemptedName: headName,
        collision: headCollision
      });

      return errorResponse(
        res,
        `Duplicate registration blocked: Fayda ID ${primaryFayda} is already active in ${headCollision.kebeleName} (${headCollision.kebeleCode}), Woreda: ${headCollision.woredaName} under Household Head "${headCollision.headName}".`,
        409
      );
    }

    // 2. Validate Dependents and ensure none collide internally or globally
    const seenDepIds = new Set();
    seenDepIds.add(primaryFayda.toUpperCase());

    for (let i = 0; i < familyMembers.length; i++) {
      const dep = familyMembers[i];
      if (!dep.name || !dep.faydaOrBirthId) {
        return errorResponse(res, `Dependent #${i + 1} requires a valid name and Fayda / Birth Certificate ID.`, 400);
      }
      const cleanDepId = dep.faydaOrBirthId.trim().toUpperCase();

      if (seenDepIds.has(cleanDepId)) {
        return errorResponse(
          res,
          `Duplicate ID within this registration: ID ${cleanDepId} appears more than once in the household form.`,
          400
        );
      }
      seenDepIds.add(cleanDepId);

      // Check against whole North Shewa database
      const depCollision = await checkGlobalIdCollision(cleanDepId);
      if (depCollision) {
        await logAudit(req, 'FRAUD_DUPLICATE_DEPENDENT_BLOCKED', 'Beneficiary', null, {
          dependentName: dep.name,
          attemptedId: cleanDepId,
          collision: depCollision
        });

        return errorResponse(
          res,
          `Duplicate dependent registration blocked: ID ${cleanDepId} for "${dep.name}" is already registered in ${depCollision.kebeleName} (${depCollision.kebeleCode}), Woreda: ${depCollision.woredaName} under household head "${depCollision.headName}".`,
          409
        );
      }
    }

    // Resolve Kebele and parent Woreda
    const kebele = await Location.findById(kebeleId);
    if (!kebele || kebele.type !== 'kebele') {
      return errorResponse(res, 'Invalid Kebele office selected', 400);
    }
    const woredaId = kebele.parentId;

    // Generate Hierarchical Unique Household Ration ID (e.g. NSZ-W01-K04-000125)
    const kebeleCode = kebele.code.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const counterKey = `RATION-${kebeleCode}`;
    const seq = await Counter.getNextSequence(counterKey);
    const rationCardId = `${kebeleCode}-${String(seq).padStart(6, '0')}`;

    // Soft duplicate check: matching name + phone in the same Kebele
    const softDuplicate = await Beneficiary.findOne({
      kebeleId,
      headName: new RegExp(`^${headName.trim()}$`, 'i'),
      phone: phone.trim()
    });
    const warning = softDuplicate
      ? `Warning: Another household with name '${headName}' and phone '${phone}' is already registered in ${kebele.name}.`
      : null;

    const calculatedFamilySize = (familyMembers && familyMembers.length > 0)
      ? (1 + familyMembers.length)
      : (Number(req.body.familySize) || 1);

    const beneficiary = await Beneficiary.create({
      rationCardId,
      faydaId: primaryFayda,
      idNumber: primaryFayda,
      idType: isFayda ? 'fayda' : 'kebele',
      headName: headName.trim(),
      gender,
      maritalStatus: maritalStatus || 'Married',
      phone: phone.trim(),
      got: got || (kebele.gots && kebele.gots[0]) || 'Got 01',
      houseNumber: houseNumber ? houseNumber.trim() : '',
      address: address ? address.trim() : '',
      kebeleId,
      woredaId,
      familyMembers,
      familySize: calculatedFamilySize,
      status: 'verified', // Verified on registration by Kebele Officer
      registeredBy: req.user._id,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    });

    // Increment Kebele location counters
    await Location.findByIdAndUpdate(kebeleId, {
      $inc: { householdCount: 1, population: calculatedFamilySize }
    });
    if (woredaId) {
      await Location.findByIdAndUpdate(woredaId, {
        $inc: { householdCount: 1, population: calculatedFamilySize }
      });
    }

    await logAudit(req, 'BENEFICIARY_REGISTER', 'Beneficiary', beneficiary._id, {
      headName: beneficiary.headName,
      rationCardId: beneficiary.rationCardId,
      faydaId: beneficiary.faydaId,
      kebeleCode,
      familySize: calculatedFamilySize
    });

    return successResponse(
      res,
      { beneficiary, warning },
      'Household successfully registered with Unique Ration ID',
      201
    );
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to register beneficiary', 500);
  }
};

const updateFamilyMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyMembers = [], maritalStatus, phone, got, houseNumber } = req.body;

    const beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) {
      return errorResponse(res, 'Household not found', 404);
    }

    const primaryFayda = beneficiary.faydaId || beneficiary.idNumber;
    const seenDepIds = new Set();
    seenDepIds.add(primaryFayda.toUpperCase());

    // Check each updated dependent ID
    for (let i = 0; i < familyMembers.length; i++) {
      const dep = familyMembers[i];
      if (!dep.name || !dep.faydaOrBirthId) {
        return errorResponse(res, `Dependent #${i + 1} requires a valid name and Fayda / Birth Certificate ID.`, 400);
      }
      const cleanDepId = dep.faydaOrBirthId.trim().toUpperCase();

      if (seenDepIds.has(cleanDepId)) {
        return errorResponse(
          res,
          `Duplicate ID ${cleanDepId} within the household members list.`,
          400
        );
      }
      seenDepIds.add(cleanDepId);

      const collision = await checkGlobalIdCollision(cleanDepId, beneficiary._id);
      if (collision) {
        return errorResponse(
          res,
          `ID collision for "${dep.name}": ID ${cleanDepId} is already active in ${collision.kebeleName} under household head "${collision.headName}".`,
          409
        );
      }
    }

    const oldFamilySize = beneficiary.familySize;
    const newFamilySize = 1 + familyMembers.length;
    const diff = newFamilySize - oldFamilySize;

    beneficiary.familyMembers = familyMembers;
    beneficiary.familySize = newFamilySize;
    if (maritalStatus) beneficiary.maritalStatus = maritalStatus;
    if (phone) beneficiary.phone = phone.trim();
    if (got) beneficiary.got = got.trim();
    if (houseNumber !== undefined) beneficiary.houseNumber = houseNumber.trim();

    await beneficiary.save();

    // Adjust population counter
    if (diff !== 0) {
      await Location.findByIdAndUpdate(beneficiary.kebeleId, { $inc: { population: diff } });
      await Location.findByIdAndUpdate(beneficiary.woredaId, { $inc: { population: diff } });
    }

    await logAudit(req, 'BENEFICIARY_FAMILY_UPDATE', 'Beneficiary', beneficiary._id, {
      rationCardId: beneficiary.rationCardId,
      oldFamilySize,
      newFamilySize
    });

    return successResponse(res, beneficiary, 'Household family members and status updated successfully');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to update family members', 500);
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
      rationCardId: beneficiary.rationCardId
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

/**
 * Request or approve Inter-Kebele household transfer
 */
const requestHouseholdTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetKebeleId, reason } = req.body;

    const beneficiary = await Beneficiary.findById(id).populate('kebeleId woredaId');
    if (!beneficiary) {
      return errorResponse(res, 'Household not found', 404);
    }

    const targetKebele = await Location.findById(targetKebeleId).populate('parentId');
    if (!targetKebele || targetKebele.type !== 'kebele') {
      return errorResponse(res, 'Invalid target Kebele selected', 400);
    }

    beneficiary.transferHistory.push({
      fromKebeleId: beneficiary.kebeleId._id,
      toKebeleId: targetKebele._id,
      requestDate: new Date(),
      status: 'pending',
      reason: reason || 'Inter-Kebele relocation'
    });

    await beneficiary.save();

    await logAudit(req, 'HOUSEHOLD_TRANSFER_REQUEST', 'Beneficiary', beneficiary._id, {
      fromKebele: beneficiary.kebeleId.name,
      toKebele: targetKebele.name,
      reason
    });

    return successResponse(res, beneficiary, 'Household transfer request registered successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to request transfer', 500);
  }
};

const approveHouseholdTransfer = async (req, res) => {
  try {
    const { id, transferIndex = 0 } = req.params;
    const beneficiary = await Beneficiary.findById(id).populate('kebeleId');
    if (!beneficiary) {
      return errorResponse(res, 'Household not found', 404);
    }

    const pendingTransfer = beneficiary.transferHistory[transferIndex] ||
      beneficiary.transferHistory.find(t => t.status === 'pending');

    if (!pendingTransfer) {
      return errorResponse(res, 'No pending transfer request found', 400);
    }

    const targetKebele = await Location.findById(pendingTransfer.toKebeleId);
    if (!targetKebele) {
      return errorResponse(res, 'Target Kebele not found', 404);
    }

    // Decrement from old kebele
    await Location.findByIdAndUpdate(beneficiary.kebeleId, {
      $inc: { householdCount: -1, population: -beneficiary.familySize }
    });

    // Generate new Ration ID for the target Kebele
    const targetKebeleCode = targetKebele.code.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const newSeq = await Counter.getNextSequence(`RATION-${targetKebeleCode}`);
    const newRationCardId = `${targetKebeleCode}-${String(newSeq).padStart(6, '0')}`;

    // Update household
    beneficiary.kebeleId = targetKebele._id;
    beneficiary.woredaId = targetKebele.parentId;
    beneficiary.rationCardId = newRationCardId;
    beneficiary.status = 'verified';

    pendingTransfer.status = 'approved';
    pendingTransfer.approvedDate = new Date();
    pendingTransfer.approvedBy = req.user._id;

    await beneficiary.save();

    // Increment in new kebele
    await Location.findByIdAndUpdate(targetKebele._id, {
      $inc: { householdCount: 1, population: beneficiary.familySize }
    });

    await logAudit(req, 'HOUSEHOLD_TRANSFER_APPROVED', 'Beneficiary', beneficiary._id, {
      newRationCardId,
      newKebele: targetKebele.name
    });

    return successResponse(
      res,
      { beneficiary, newRationCardId },
      'Transfer approved successfully. New Unique Ration ID generated.'
    );
  } catch (err) {
    return errorResponse(res, 'Failed to approve transfer', 500);
  }
};

/**
 * Returns formatted slip details for printable physical paper booklet
 */
const getBookletSlipData = async (req, res) => {
  try {
    const { id } = req.params;
    const beneficiary = await Beneficiary.findById(id)
      .populate('kebeleId', 'name nameAm code')
      .populate('woredaId', 'name nameAm code');

    if (!beneficiary) {
      return errorResponse(res, 'Beneficiary not found', 404);
    }

    const slip = {
      rationCardId: beneficiary.rationCardId,
      headName: beneficiary.headName,
      faydaId: beneficiary.faydaId || beneficiary.idNumber,
      gender: beneficiary.gender,
      maritalStatus: beneficiary.maritalStatus,
      phone: beneficiary.phone,
      got: beneficiary.got,
      houseNumber: beneficiary.houseNumber,
      familySize: beneficiary.familySize,
      kebeleName: beneficiary.kebeleId ? beneficiary.kebeleId.name : '',
      kebeleNameAm: beneficiary.kebeleId ? beneficiary.kebeleId.nameAm : '',
      kebeleCode: beneficiary.kebeleId ? beneficiary.kebeleId.code : '',
      woredaName: beneficiary.woredaId ? beneficiary.woredaId.name : '',
      woredaNameAm: beneficiary.woredaId ? beneficiary.woredaId.nameAm : '',
      issuedDate: beneficiary.createdAt,
      qrData: JSON.stringify({
        rationId: beneficiary.rationCardId,
        faydaId: beneficiary.faydaId || beneficiary.idNumber,
        head: beneficiary.headName,
        kebele: beneficiary.kebeleId ? beneficiary.kebeleId.code : ''
      })
    };

    return successResponse(res, slip, 'Booklet slip data generated');
  } catch (err) {
    return errorResponse(res, 'Failed to generate booklet slip', 500);
  }
};

module.exports = {
  getBeneficiaries,
  getBeneficiaryById,
  checkIdAvailability,
  registerBeneficiary,
  updateFamilyMembers,
  verifyBeneficiary,
  suspendBeneficiary,
  requestHouseholdTransfer,
  approveHouseholdTransfer,
  getBookletSlipData
};
