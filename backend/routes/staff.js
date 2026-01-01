const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/staffController");

// Chỉ admin được truy cập
router.get("/", auth("Admin"), controller.getAllStaff);

module.exports = router;
