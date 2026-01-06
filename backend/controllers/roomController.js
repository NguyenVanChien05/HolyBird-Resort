const { pool, sql } = require("../config/db");

// ===== GET RANKS =====
exports.getRanks = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
    .query("SELECT RankID, RankName FROM RankRoom");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== GET TYPES =====
exports.getTypes = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
    .query("SELECT TypeID, TypeName, Capacity FROM RoomType");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== GET FLOORS =====
exports.getFloors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
    .query("SELECT DISTINCT FloorNumber FROM Room ORDER BY FloorNumber");
    res.json(result.recordset.map(r => r.FloorNumber));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== GET PRICE =====
exports.getPrice = async (req, res) => {
  const { rankID, typeID } = req.query;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("rankID", sql.Int, rankID)
      .input("typeID", sql.Int, typeID)
      .query("SELECT Price FROM PriceRoom WHERE RankID=@rankID AND TypeID=@typeID");

    if (!result.recordset.length) return res.status(404).json({ message: "Không tìm thấy giá" });

    res.json({ price: result.recordset[0].Price });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET ROOMS ================= */
exports.getAllRooms = async (req, res) => {
  try {
    const result = await pool.request()
      .execute("sp_GetAllRooms");
    res.json(result.recordset);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

/* ================= UPDATE ROOM STATUS ================= */
exports.updateRoomStatus = async (req, res) => {
  try {
    await pool.request()
      .input("RoomID", sql.Int, req.params.id)
      .input("StatusPhysic", sql.VarChar, req.body.StatusPhysic)
      .input("Role", sql.VarChar, req.user.role)
      .execute("sp_UpdateRoomStatus");

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

/* ================= UPDATE PRICE ================= */
exports.updateRoomPrice = async (req, res) => {
  try {
    const { RankID, TypeID, Price } = req.body;

    await pool.request()
      .input("RankID", sql.Int, RankID)
      .input("TypeID", sql.Int, TypeID)
      .input("Price", sql.Money, Price)
      .input("Role", sql.VarChar, req.user.role)
      .execute("sp_UpdateRoomPrice");

    res.json({ message: "Price updated" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};
