const express = require('express');
const router = express.Router();
const { getStaffs, getStaffById, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

router.get('/', getStaffs);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
