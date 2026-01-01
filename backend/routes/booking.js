const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Kiểm tra xem bạn dùng router.post hay get
router.post("/create", bookingController.createBooking);

module.exports = router;