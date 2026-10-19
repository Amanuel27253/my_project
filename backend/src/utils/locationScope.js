const Location = require('../models/Location');

/**
 * Resolves an array of Location ObjectIds that the given user has access to.
 * - Admin: null (represents unrestricted access to all locations)
 * - Zone level user: Zone + all Woredas under it + all Kebeles under those Woredas
 * - Woreda level user: That Woreda + all Kebeles under it
 * - Kebele level user: Only that Kebele
 */
const getAccessibleLocationIds = async (user) => {
  if (user.role === 'admin') {
    return null; // Null means all locations
  }

  if (!user.locationId) {
    return [];
  }

  const userLocation = await Location.findById(user.locationId).lean();
  if (!userLocation) {
    return [user.locationId];
  }

  if (userLocation.type === 'kebele') {
    return [userLocation._id];
  }

  if (userLocation.type === 'woreda') {
    const kebeles = await Location.find({ parentId: userLocation._id }, '_id').lean();
    return [userLocation._id, ...kebeles.map(k => k._id)];
  }

  if (userLocation.type === 'zone') {
    // Zone level: get all woredas and all kebeles
    const woredas = await Location.find({ parentId: userLocation._id }, '_id').lean();
    const woredaIds = woredas.map(w => w._id);
    const kebeles = await Location.find({ parentId: { $in: woredaIds } }, '_id').lean();
    return [userLocation._id, ...woredaIds, ...kebeles.map(k => k._id)];
  }

  return [user.locationId];
};

module.exports = {
  getAccessibleLocationIds
};
