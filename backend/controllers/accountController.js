const { pool, sql } = require('../config/db');

// Lấy tất cả tài khoản
exports.getAccounts = async (req, res) => {
  try {
    // Kết nối pool nếu chưa connect
    if (!pool.connected) await pool.connect();

    const result = await pool.request()
    .query('SELECT * FROM Account');

    res.status(200).json({ data: result.recordset });
  } catch (err) {
    console.error("Lỗi khi lấy account:", err);
    res.status(500).json({ message: err.message });
  }
};

