require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const Box = require("../models/Box");

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await Box.findByIdAndDelete("6857329106f20f4a682c90aa");
  console.log("🧼 Deleted:", result);

  mongoose.disconnect();
}

cleanup();