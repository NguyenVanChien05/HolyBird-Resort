const express = require("express");
const { pool, sql } = require("../config/db");
const router = express.Router();

const auth = require("../middlewares/auth");
const { 
  getGuestsByGroup, 
  getAllGroupsWithGuests, 
  createGroupAndTransaction 
} = require("../controllers/groupController");

router.get("/", auth("Staff", "Admin"), getAllGroupsWithGuests);
router.get("/my-group", auth("Guest"), getGuestsByGroup);
router.post("/create-group", auth("Staff"), createGroupAndTransaction);

module.exports = router;