const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const controller = require('../controllers/roomController');

// 1. Các API lấy dữ liệu
router.get('/', controller.getAllRooms);      
router.get('/ranks', controller.getRanks);    
router.get('/types', controller.getTypes);    
router.get('/price', controller.getPrice);    

// 2. Cập nhật trạng thái (Staff, Admin)
// Quan trọng: Frontend gọi PATCH
router.patch('/:roomId/status', auth("Staff", "Admin"), controller.updateRoomStatus);

// 3. Cập nhật giá phòng (Chỉ Admin)
// Quan trọng: Frontend gọi POST /update-price
router.post('/update-price', auth("Admin"), controller.updateRoomPrice);

module.exports = router;