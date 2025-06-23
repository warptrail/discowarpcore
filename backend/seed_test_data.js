require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/discowarpcore";

const boxSchema = new mongoose.Schema({
  label: String,
  contents: [String],
});

const Box = mongoose.model("Box", boxSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await Box.create({
      label: "Garage Tools",
      contents: ["Hammer", "Screwdriver", "Wrench"],
    });
    console.log("✅ Test box inserted");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Insert failed:", err);
  }
})();