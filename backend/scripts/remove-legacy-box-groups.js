// One-time cleanup of the retired field; box records and contents are preserved.
require('dotenv').config({ path: './backend/.env', quiet: true });
const mongoose = require('mongoose');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const boxes = mongoose.connection.collection('boxes');
    const filter = { group: { $exists: true } };
    const before = await boxes.countDocuments(filter);
    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify({ dryRun: true, boxesWithLegacyField: before }));
      return;
    }
    const result = await boxes.updateMany(filter, { $unset: { group: '' } });
    const remaining = await boxes.countDocuments(filter);
    console.log(JSON.stringify({ applied: true, modified: result.modifiedCount, remaining }));
    if (remaining) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
