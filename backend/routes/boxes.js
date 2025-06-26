const express = require("express");
const router = express.Router();
const {
    getBoxes,
    postBox,
    patchBox
} = require("../controllers/boxController");

router.get("/", getBoxes);
router.post("/", postBox);
router.patch("/:id", patchBox);

module.exports = router;