const { pool, sql } = require("../config/db");

exports.createBooking = async (req, res) => {
  // Lấy dữ liệu từ body (đảm bảo frontend gửi đúng các field này)
  const { rankId, floor, typeId, count, groupId, staffId, startDate, endDate } = req.body;

  try {
    console.log("BOOKING API HIT", req.body);

    // Sử dụng pool.request() và .execute() để gọi Stored Procedure
    const result = await pool.request()
      .input("RankID", sql.Int, rankId)
      .input("FloorNumber", sql.Int, floor)
      .input("TypeID", sql.Int, typeId)
      .input("RoomCount", sql.Int, count)
      .input("GroupID", sql.Int, groupId)
      .input("StaffID", sql.Int, staffId)
      .input("StartDate", sql.DateTime, startDate)
      .input("EndDate", sql.DateTime, endDate)
      .execute("sp_bookRooms"); // Tên Procedure bạn đã chạy trong SQL

    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: result.recordset[0].Message || "Đặt phòng thành công!",
      data: result.recordset[0]
    });

  } catch (err) {
    // Quan trọng: err.message sẽ chứa nội dung lỗi từ lệnh THROW trong SQL
    console.error("BOOKING ERROR:", err.message);
    res.status(400).json({
      success: false,
      message: err.message 
    });
  }
};