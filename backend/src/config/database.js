const mongoose = require('mongoose');

let memoryReplSet = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && process.env.NODE_ENV !== 'test') {
      console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connected successfully.');
      return;
    }
  } catch (err) {
    console.warn('Could not connect to external MongoDB URI:', err.message);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.log('Falling back to MongoMemoryReplSet for local development/testing with transaction support...');
  }

  // Fallback to in-memory replica set for transactions
  try {
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    memoryReplSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    const replSetUri = memoryReplSet.getUri();
    await mongoose.connect(replSetUri);
    console.log('In-memory MongoDB Replica Set connected at:', replSetUri);
  } catch (memErr) {
    console.error('Failed to initialize MongoDB connection:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryReplSet) {
      await memoryReplSet.stop();
    }
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
