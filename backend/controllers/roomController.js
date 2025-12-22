const sql = require("mssql");
const { pool } = require("../config/db");

/* ================= GET ALL ROOMS ================= */
exports.getAllRooms = async (req, res) => {
  try {
    const { floor } = req.query;

    let query = `
      SELECT 
        r.RoomID,
        r.RoomNumber,
        r.FloorNumber,
        r.StatusPhysic,
        rr.RankName,
        rt.TypeName
      FROM Room r
      JOIN RankRoom rr ON r.RankID = rr.RankID
      JOIN RoomType rt ON r.TypeID = rt.TypeID
    `;

    if (floor) {
      query += " WHERE r.FloorNumber = @floor";
    }

    const request = pool.request();
    if (floor) request.input("floor", floor);
    const result = await request.query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { StatusPhysic } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("RoomID", id)
      .input("StatusPhysic", StatusPhysic)
      .query(`
        UPDATE Room
        SET StatusPhysic = @StatusPhysic
        WHERE RoomID = @RoomID
      `);

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ================= UPDATE PRICE ================= */
exports.updatePrice = async (req, res) => {
  const { id } = req.params;
  const { Price } = req.body;

  try {
    const pool = await poolPromise;

    // lấy RankID + TypeID từ Room
    const room = await pool.request()
      .input("RoomID", id)
      .query(`SELECT RankID, TypeID FROM Room WHERE RoomID = @RoomID`);

    const { RankID, TypeID } = room.recordset[0];

    // MERGE để insert hoặc update
    await pool.request()
      .input("RankID", RankID)
      .input("TypeID", TypeID)
      .input("Price", Price)
      .query(`
        MERGE PriceRoom AS target
        USING (SELECT @RankID AS RankID, @TypeID AS TypeID) AS src
        ON target.RankID = src.RankID AND target.TypeID = src.TypeID
        WHEN MATCHED THEN
          UPDATE SET Price = @Price
        WHEN NOT MATCHED THEN
          INSERT (RankID, TypeID, Price)
          VALUES (@RankID, @TypeID, @Price);
      `);

    res.json({ message: "Price updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
