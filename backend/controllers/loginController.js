const jwt = require("jsonwebtoken");
const { pool, sql } = require("../config/db");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const rs = await pool.request()
      .input("Username", sql.VarChar, username)
      .execute("sp_Login");

    if (!rs.recordset.length)
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });

    const acc = rs.recordset[0];

    // ✅ SO PASSWORD TẠI JS (đúng chuẩn)
    if (acc.Password !== password)
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });

    const token = jwt.sign(
      {
        accountId: acc.AccountID,
        role: acc.Role,
        groupId: acc.GroupID || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        username: acc.Username,
        role: acc.Role,
        groupId: acc.GroupID
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
