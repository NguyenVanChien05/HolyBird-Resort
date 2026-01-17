const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

// Route: /api/demo/cancel (T1)
router.post('/cancel', demoController.cancelTransaction);

// Route: /api/demo/confirm (T2)
router.post('/confirm', demoController.confirmTransaction);

// Route: /api/demo/reset
router.post('/reset', demoController.resetData);

// Route: /api/demo/status/:transactionId
router.get('/status/:transactionId', demoController.getStatus);

module.exports = router;
