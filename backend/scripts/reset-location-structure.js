require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Box = require('../models/Box');
const Location = require('../models/Location');

const shouldApply = process.argv.includes('--apply');
const LEGACY_LOCATION_NAME_INDEX = 'name_1';

async function main() {
  try {
    await connectDB(process.env.MONGO_URI);

    const [locations, boxesWithLocation, indexes] = await Promise.all([
      Location.countDocuments(),
      Box.countDocuments({ $or: [{ locationId: { $ne: null } }, { location: { $exists: true } }] }),
      Location.collection.indexes(),
    ]);
    const hasLegacyNameIndex = indexes.some((index) => index.name === LEGACY_LOCATION_NAME_INDEX);

    if (!shouldApply) {
      console.log(JSON.stringify({
        dryRun: true,
        locations,
        boxesWithLocation,
        hasLegacyNameIndex,
      }));
      return;
    }

    const [deletedLocations, clearedBoxes] = await Promise.all([
      Location.deleteMany({}),
      // `location` was retired from the Mongoose schema, so use the raw
      // collection to ensure its legacy values are actually removed.
      Box.collection.updateMany({}, { $unset: { locationId: 1, location: 1 } }),
    ]);

    if (hasLegacyNameIndex) {
      await Location.collection.dropIndex(LEGACY_LOCATION_NAME_INDEX);
    }

    console.log(JSON.stringify({
      applied: true,
      deletedLocations: deletedLocations.deletedCount,
      clearedBoxes: clearedBoxes.modifiedCount,
      droppedLegacyNameIndex: hasLegacyNameIndex,
    }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
