const express = require("express");
const router = express.Router();
const controller = require("../controllers/transactionController");
const auth = require("../middlewares/auth");

router.post("/demo-dirty/:id", controller.simulateDirtyUpdate);
router.get("/clean-list", controller.getAllTransactionsClean);
/**
 * Guest: xem giao dịch của chính đoàn mình
 * GET /api/transactions/my-transactions
 */
router.get(
  "/my-transactions",
  auth("Guest"),
  controller.getMyTransaction
);

/**
 * Staff: xem toàn bộ giao dịch
 * GET /api/transactions
 */
router.get(
  "/",
  auth("Staff", "Admin"),
  controller.getAllTransactions
);

/**
 * Xem chi tiết transaction
 * Guest chỉ xem của chính mình
 * Staff xem tất cả
 */
router.get(
  "/:transactionID",
  controller.getBookingTransactionDetail
);

/**
 * POST /api/transactions/create-detail
 */
router.post(
  "/create-detail",
  controller.createTransDetail
);

router.post(
  "/assign-rooms",
  controller.assignGuestToRoom
);

router.post(
  "/delete-empty-booked-rooms",
  controller.deleteEmptyBookedRooms
);

router.post(
  "/:detailID/checkin",
  auth("Staff"), // chỉ Staff hoặc Admin được check-in
  controller.checkIn
);

// ===== Check-out =====
router.post(
  "/:detailID/checkout",
  auth("Staff"),
  controller.checkOut
);


router.post(
  "/:detailID/delete",
  auth("Guest", "Staff"),
  controller.deleteBookingDetail
);



module.exports = router;
