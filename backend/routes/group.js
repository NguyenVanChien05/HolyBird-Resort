const express = require("express");
const { pool, sql } = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const groupId = req.user.groupId; // lấy từ token

    const result = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .query(`
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
        WHERE gr.GroupID = @groupId
        ORDER BY g.GuestID
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
