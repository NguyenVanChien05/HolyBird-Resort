// controllers/room.controller.js
const { pool, sql } = require("../config/db");

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
