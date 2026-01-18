const { sql, pool } = require("../config/db.js");

exports.guestBookRoom = async (req, res) => {
  const { rankID, typeID, checkInDate, checkOutDate, clientPrice } = req.body;
  const groupID = req.user.groupId; 

  try {
    const request = pool.request(); 

    const result = await request
      .input("GroupID", sql.Int, groupID)
      .input("RankID", sql.Int, rankID)
      .input("TypeID", sql.Int, typeID)
      .input("CheckInDate", sql.Date, checkInDate)
      .input("CheckOutDate", sql.Date, checkOutDate)
      .input("ClientPrice", sql.Decimal(18, 0), clientPrice)
      .execute("sp_Guest_BookRoom_Transaction");

    const bookingInfo = result.recordset[0];

    res.json({ 
      message: "Đặt phòng thành công", 
      data: bookingInfo 
    });

  } catch (err) {
    console.error("Booking Error:", err.message);

    if (err.message.includes("Giá phòng đã thay đổi")) {
      return res.status(409).json({ message: err.message });
    }

    if (err.message.includes("hết phòng")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
};