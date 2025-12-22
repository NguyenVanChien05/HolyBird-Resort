const express = require('express');
const router = express.Router();
const { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');

// CRUD routes
router.get('/', getAccounts);           // Lấy tất cả
router.get('/:id', getAccountById);    // Lấy theo ID
router.post('/', createAccount);       // Tạo mới
router.put('/:id', updateAccount);     // Cập nhật
router.delete('/:id', deleteAccount);  // Xóa

module.exports = router;
