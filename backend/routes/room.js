const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/roomController");

router.get("/", controller.getAllRooms);

// chỉ admin mới update price
router.put("/price", auth("Admin"), controller.updateRoomPrice);

// admin + staff mới update status
router.put("/:id/status", auth("Admin", "Staff"), controller.updateRoomStatus);

module.exports = router;
