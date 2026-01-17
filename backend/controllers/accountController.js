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

// Tạo tài khoản mới (Admin/Staff)
exports.createAccount = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    if (!pool.connected) await pool.connect();

    // Check existent
    const check = await pool.request()
      .input('Username', sql.VarChar, username)
      .query('SELECT * FROM Account WHERE Username = @Username');

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Username đã tồn tại' });
    }

    const result = await pool.request()
      .input('Username', sql.VarChar, username)
      .input('Password', sql.VarChar, password)
      .input('Role', sql.VarChar, role)
      .query(`
            INSERT INTO Account (Username, Password, Role) 
            VALUES (@Username, @Password, @Role);
            SELECT SCOPE_IDENTITY() as AccountID;
        `);

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      accountId: result.recordset[0].AccountID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

