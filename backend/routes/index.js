const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Resort API is running!</h1>
        <p>Test các endpoint CRUD của hệ thống:</p>
        <ul>
            <li><a href="/account">Account CRUD (GET tất cả)</a></li>
            <li><a href="/staff">Staff CRUD (GET tất cả)</a></li>
            <li><a href="/guest">Guest CRUD (GET tất cả)</a></li>
            <li><a href="/room">Room CRUD (GET tất cả)</a></li>
        </ul>
        <p>Chú ý: POST/PUT/DELETE cần dùng Postman hoặc curl.</p>
    `);
});

module.exports = router;
