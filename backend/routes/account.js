const express = require('express');
const router = express.Router();
const { getAccounts, createAccount } = require('../controllers/accountController');
const auth = require('../middlewares/auth');

// CRUD routes
router.get('/', getAccounts);           // Lấy tất cả
router.post('/', auth("Admin"), createAccount); // Chỉ Admin được tạo account lẻ (Staff/Admin)

module.exports = router;
