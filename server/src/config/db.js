const mongoose = require('mongoose');

/**
 * Connects the server to the configured MongoDB instance.
 * @returns {Promise<void>} Resolves once the database connection is established.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/architecture-diagram-generator';
  try {
    await mongoose.connect(uri);
    console.log(`[db] connected to ${uri}`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;