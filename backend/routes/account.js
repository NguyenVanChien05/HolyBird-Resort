const express = require('express');
const router = express.Router();
const { getAccounts } = require('../controllers/accountController');

// CRUD routes
router.get('/', getAccounts);           // Lấy tất cả

module.exports = router;
