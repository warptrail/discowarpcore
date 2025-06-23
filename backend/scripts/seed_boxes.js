// backend/scripts/seed_boxes.js
require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const Box = require("../models/Box");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Box.deleteMany(); // Clear old test data

    // Step 1: Create top-level boxes
    const garageBin = await Box.create({
      label: "Garage Bin",
      location: "Garage",
      contents: ["Extension Cord", "Flashlight"],
      parentBox: null,
    });

    const kitchenDrawer = await Box.create({
      label: "Kitchen Drawer",
      location: "Kitchen",
      contents: ["Can Opener", "Spatula"],
      parentBox: null,
    });

    // Step 2: Create a nested box
    const toolPouch = await Box.create({
      label: "Tool Pouch",
      location: null,
      contents: ["Hex Keys", "Mini Screwdriver"],
      parentBox: garageBin._id,
    });

    const measuringCups = await Box.create({
      label: "Measuring Cup Set",
      contents: ["1 cup", "1/2 cup", "1/4 cup"],
      parentBox: kitchenDrawer._id,
    });

    const standaloneBox = await Box.create({
      label: "Floating Mystery Box",
      contents: ["Secret Map"],
      parentBox: null,
    });

    console.log("✅ Seed data created:");
    console.log({ garageBin, kitchenDrawer, toolPouch, measuringCups, standaloneBox });
    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();

/*
    Run:
    node backend/scripts/seed_boxes.js

    Then Visit:
    http://localhost:5002/api/boxes
*/

