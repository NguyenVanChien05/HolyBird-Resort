const { pool, sql } = require("../config/db");

// Lấy danh sách nhân viên
exports.getAllStaff = async (req, res) => {
  try {
    const result = await pool.request().execute("sp_GetAllStaff");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
