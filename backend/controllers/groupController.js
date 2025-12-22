const sql = require("mssql");
const { pool } = require("../config/db");

// ========= Get Members of my group =========
exports.getMember = async (req, res) => {
  try {
    const groupid = req.user.GroupID; // lấy từ token

    const query = `
      SELECT 
        gr.GroupID,
        g.GuestID,
        g.FullName,
        g.CMND
      FROM Guest g
      JOIN GuestGroup_Detail gr_dt 
        ON g.GuestID = gr_dt.GuestID
      JOIN GuestGroup gr 
        ON gr.GroupID = gr_dt.GroupID
      WHERE gr.GroupID = @groupid
      ORDER BY g.GuestID
    `;

    const request = pool.request();
    request.input("groupid", sql.Int, groupid);

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
