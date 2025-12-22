const express = require('express');
const router = express.Router();
const { getGuests, getGuestById, createGuest, updateGuest, deleteGuest } = require('../controllers/guestController');

router.get('/', getGuests);
router.get('/:id', getGuestById);
router.post('/', createGuest);
router.put('/:id', updateGuest);
router.delete('/:id', deleteGuest);

module.exports = router;
