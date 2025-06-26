const Box = require("../models/Box");
const { updateBox } = require("../services/boxService");

// GET /api/boxes?parent=<id|null>
// TODO: Check that this function shoul import getBoxesByParent from ../services/boxService.js
async function getBoxes(req, res) {
  try {
    const { parent } = req.query;
    const filter = parent === "null" ? { parentBox: null } : parent ? { parentBox: parent } : {};
    const boxes = await Box.find(filter).populate("parentBox");
    res.json(boxes);
  } catch (err) {
    console.error("❌ Failed to fetch boxes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function postBox(req, res) {
  try {
    const newBox = await createBox(req.body);
    res.status(201).json(newBox);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({ error: "Box ID is already in use" });
    }

    console.error("❌ Box creation error:", err);
    res.status(500).json({ error: "Failed to create box" });
  }
}

async function patchBox(req, res) {
  try {
    const updated = await updateBox(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Box not found" });
    }
    res.json(updated);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.box_id) {
      return res.status(400).json({ error: "Box ID is already in use" });
    }

    console.error("❌ Error updating box:", err);
    res.status(400).json({ error: "Failed to update box" });
  }
}

module.exports = {
  getBoxes,
  postBox,
  patchBox
};