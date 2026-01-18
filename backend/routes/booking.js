const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const auth = require("../middlewares/auth");

/** * Khách hàng tự đặt phòng
 * URL thực tế: POST /api/booking
 */
router.post(
  "/",
  auth("Guest"),
  controller.guestBookRoom 
);

module.exports = router;