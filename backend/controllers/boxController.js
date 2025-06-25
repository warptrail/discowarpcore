const Box = require("../models/Box");

// GET /api/boxes?parent=<id|null>
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

module.exports = {
  getBoxes
};