const express = require("express");
const router = express.Router();
const {
  getItems,
  postItem,
  patchItem,
  deleteItemById,
} = require("../controllers/itemController");

router.get("/", getItems);
router.post("/", postItem);
router.patch("/:id", patchItem);
router.delete("/:id", deleteItemById);

module.exports = router;