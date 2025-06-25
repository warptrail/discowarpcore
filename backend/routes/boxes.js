const express = require("express");
const router = express.Router();
const { getBoxes } = require("../controllers/boxController");

router.get("/", getBoxes);

module.exports = router;