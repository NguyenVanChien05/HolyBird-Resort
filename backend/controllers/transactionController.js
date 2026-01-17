const { sql, pool } = require("../config/db");

/**
 * GUEST - xem transaction của đoàn mình
 */
exports.getMyTransaction = async (req, res) => {
  try {
    if (!pool.connected) await pool.connect();

    const accountId = req.user.accountId;

    const result = await pool.request()
      .input("AccountID", sql.Int, accountId)
      .execute("sp_GetMyTransaction");

    return res.status(200).json(result.recordset);

  } catch (err) {
    console.error("❌ SQL ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * STAFF - xem toàn bộ transaction
 */
exports.getAllTransactions = async (req, res) => {
  try {
    if (!pool.connected) await pool.connect();

    const result = await pool.request()
      .execute("sp_GetAllTransactions");

    res.json(result.recordset);
  } catch (err) {
    console.error("getAllTransactions error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getBookingTransactionDetail = async (req, res) => {
  try {
    const { transactionID } = req.params;

    if (!pool.connected) await pool.connect();
    const result = await pool.request()
      .input("TransactionID", sql.Int, transactionID)
      .execute("sp_GetBookingTransactionDetail");

    // SP trả về 2 recordsets
    const details = result.recordsets[0] || [];
    const keyCards = result.recordsets[1] || [];

    res.json({ details, keyCards });
  } catch (err) {
    console.error("getBookingTransactionDetail error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.createTransDetail = async (req, res) => {
  const { transactionID, requests, guests } = req.body;

  if (!transactionID || !Array.isArray(requests)) {
    return res.status(400).json({
      message: "transactionID and requests are required"
    });
  }

  try {
    if (!pool.connected) await pool.connect();

    /* ===== 1. TẠO TVP BOOKING REQUEST ===== */
    const tvp = new sql.Table("TVP_BookingRequest");

    tvp.columns.add("RankID", sql.Int);
    tvp.columns.add("TypeID", sql.Int);
    tvp.columns.add("FloorNumber", sql.Int);
    tvp.columns.add("RoomCount", sql.Int);
    tvp.columns.add("PeopleCount", sql.Int);   // ✅ BẮT BUỘC
    tvp.columns.add("CheckInDate", sql.Date);
    tvp.columns.add("CheckOutDate", sql.Date);

   
    requests.forEach(r => {
      tvp.rows.add(
        r.rankID,
        r.typeID,
        r.floor ?? null,
        r.roomCount,
        r.peopleCount,      // ✅ map đúng
        r.fromDate,
        r.toDate
      );
    });


      await pool.request()
      .input("TransactionID", sql.Int, transactionID)
      .input("Requests", tvp)
      .execute("sp_CreateBookingDetail");
/* ===== 2. AUTO ASSIGN ROOM ===== */

      await pool.request()
        .input("TransactionID", sql.Int, transactionID)
        .execute("sp_AutoAssignRoom");

    if (Array.isArray(guests) && guests.length > 0) {
      const tvpGuest = new sql.Table("TVP_Guest");

      tvpGuest.columns.add("FullName", sql.NVarChar(100));
      tvpGuest.columns.add("CMND", sql.VarChar(12));

      guests.forEach(g => {
        tvpGuest.rows.add(
          g.fullName,
          g.cmnd || null
        );
      });

    }

    res.status(201).json({
      message: "Booking detail created & rooms assigned successfully"
    });

  } catch (err) {
    console.error("createTransDetail error:", err);
    res.status(500).json({
      message: err.message
    });
  }

};

/**
 * Assign guest(s) to rooms of a transaction
 */
exports.assignGuestToRoom = async (req, res) => {
  const { transactionID, guests } = req.body;

  if (!transactionID || !Array.isArray(guests)) {
    return res.status(400).json({ message: "TransactionID và guests là bắt buộc" });
  }

  // 1️⃣ Kiểm tra guest rỗng trước khi assign
  const emptyGuest = guests.find(g => !g.fullName && !g.cmnd);
  if (emptyGuest) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ thông tin khách trước khi gán phòng."
    });
  }

  try {
    if (!pool.connected) await pool.connect();

    const tvpGuest = new sql.Table("TVP_Guest");
    tvpGuest.columns.add("FullName", sql.NVarChar(100));
    tvpGuest.columns.add("CMND", sql.VarChar(12));

    guests.forEach(g => tvpGuest.rows.add(g.fullName, g.cmnd || null));

    await pool.request()
      .input("TransactionID", sql.Int, transactionID)
      .input("Guests", tvpGuest)
      .execute("sp_AssignGuestToRoom");

    res.status(200).json({ message: "Guests assigned successfully" });

  } catch (err) {
    console.error("assignGuestToRoom error:", err);
    res.status(500).json({ message: err.message || "Error assigning guests" });
  }
};

exports.deleteEmptyBookedRooms = async (req, res) => {
  const { transactionID } = req.body; 
  if (!transactionID) {
    return res.status(400).json({ message: "TransactionID is required" });
  } 
  try {
    await pool.request()
      .input("TransactionID", sql.Int, transactionID)
      .execute("sp_DeleteEmptyBookedRooms");
    res.status(200).json({ message: "Empty booked rooms deleted successfully" });
  } catch (err) {
    console.error("deleteEmptyBookedRooms error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  } 
};


// ===== Check-in & issue KeyCard =====
exports.checkIn = async (req, res) => {
  const { detailID } = req.params;

  if (!detailID) {
    return res.status(400).json({ message: "DetailID is required" });
  }

  try {
    // 1️⃣ Call sp_CheckIn và lấy KeyCard vừa gán
    const result = await pool.request()
      .input("DetailID", sql.Int, detailID)
      .execute("sp_CheckIn");

    // Backend controller
    const keyCards = result.recordset.map(kc => ({
      ...kc,
      IssueDate: kc.IssueDate ? kc.IssueDate.toISOString().slice(0,10) : null,
      ExpireDate: kc.ExpireDate ? (kc.ExpireDate instanceof Date ? kc.ExpireDate.toISOString().slice(0,10) : kc.ExpireDate) : null,
    }));

    if (!keyCards || keyCards.length === 0) {
      return res.status(400).json({ message: "No available KeyCard to assign" });
    }
    
    console.log("Issued KeyCard:", keyCards);
    // 3️⃣ Trả về thông tin KeyCard cho frontend
    res.status(200).json({ 
      message: "Checked in successfully and KeyCard issued",
      keyCards
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ===== Check-out & expire KeyCard =====
exports.checkOut = async (req, res) => {
  const { detailID } = req.params;

  if (!detailID) {
    return res.status(400).json({ message: "DetailID is required" });
  }

  try {
    // 1️⃣ Call sp_CheckOut và lấy KeyCard vừa reset
    const result = await pool.request()
      .input("DetailID", sql.Int, detailID)
      .execute("sp_CheckOut");

    const keyCards = result.recordset;

    // 2️⃣ Log KeyCard đã expire (tùy chọn)
    console.log("Expired KeyCard:", keyCards);

    // 3️⃣ Trả về thông tin KeyCard vừa expire
    res.status(200).json({
      message: "Checked out successfully, KeyCard expired",
      keyCards
    });
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};


// ===== Cancel Booking =====
exports.deleteBookingDetail = async (req, res) => {
  const { detailID } = req.params;

  if (!detailID) {
    return res.status(400).json({ message: "DetailID is required" });
  }

  try {
    
    await pool.request()
      .input("DetailID", sql.Int, detailID)
      .execute("sp_DeleteBookingDetail");

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.simulateDirtyUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!pool.connected) await pool.connect();
    
    // Gọi procedure giả lập (Lưu ý: hàm này sẽ đợi 15s mới trả về kết quả)
    await pool.request()
      .input("TransactionID", sql.Int, id)
      .execute("sp_Demo_DirtyUpdate");

    res.json({ message: "Đã giả lập nhập nhầm và Rollback thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTransactionsClean = async (req, res) => {
  try {
    if (!pool.connected) await pool.connect();
    const result = await pool.request()
      .execute("sp_GetAllTransactions_Clean");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};