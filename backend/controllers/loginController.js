const jwt = require("jsonwebtoken");
const { pool, sql } = require("../config/db");
require("dotenv").config();

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("LOGIN API HIT", req.body);

    const rs = await pool.request()
      .input("username", sql.VarChar, username)
      .query(`
        SELECT AccountID, Username, Password, Role
        FROM Account
        WHERE Username = @username
      `);

    if (!rs.recordset.length)
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });

    const acc = rs.recordset[0];

    // ✅ so mật khẩu tại JS
    if (acc.Password !== password)
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });

    let groupId = null;
    if (acc.Role === "Guest") {
      const g = await pool.request()
        .input("accountId", sql.Int, acc.AccountID)
        .query(`SELECT GroupID FROM GuestGroup WHERE AccountID=@accountId`);
      if (g.recordset.length) groupId = g.recordset[0].GroupID;
    }

    const token = jwt.sign(
      { accountId: acc.AccountID, role: acc.Role, groupId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { username: acc.Username, role: acc.Role, groupId } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
