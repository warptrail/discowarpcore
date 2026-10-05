const mongoose = require("mongoose");

const DB_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 5_000,
  socketTimeoutMS: 10_000,
  bufferTimeoutMS: 5_000,
};

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, DB_CONNECT_OPTIONS);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function getDatabaseReadiness({ timeoutMs = 2_000 } = {}) {
  const readyState = mongoose.connection.readyState;
  if (readyState !== 1 || !mongoose.connection.db) {
    return {
      ok: false,
      state: readyState,
      reason: 'not_connected',
    };
  }

  try {
    await mongoose.connection.db.command({ ping: 1 }, { maxTimeMS: timeoutMs });
    return {
      ok: true,
      state: readyState,
    };
  } catch (error) {
    return {
      ok: false,
      state: readyState,
      reason: 'ping_failed',
      error,
    };
  }
}

module.exports = connectDB;
module.exports.DB_CONNECT_OPTIONS = DB_CONNECT_OPTIONS;
module.exports.getDatabaseReadiness = getDatabaseReadiness;
