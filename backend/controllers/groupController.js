const { pool, sql } = require('../config/db');


exports.getGuestsByGroup = async (req, res) => {
  const groupId = req.user.groupId;
  try {
    const result = await pool
      .request()
      .input("GroupID", sql.Int, groupId)
      .execute("GetGuestsByGroup");

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên nhóm bạn.", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.getAllGroupsWithGuests = async (req, res) => {
  try {
    const result = await pool.request()
    .execute("GetAllGroupsWithGuests");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy tất cả nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.createGroupAndTransaction = async (req, res) => {
  const { startDate, endDate, status, guests } = req.body;
  console.log(">>> createGroupAndTransaction HIT <<<");
  console.log("Request body:", req.body);
  console.log("Authenticated user:", req.user);

  // 1️⃣ Validate input
  if (!startDate || !endDate || !Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ message: "startDate, endDate và guests là bắt buộc" });
  }

  if (!guests.every(g => g.fullName && g.isLeader)) {
    return res.status(400).json({ message: "FullName và IsLeader của tất cả guest là bắt buộc" });
  }

  try {
    if (!pool.connected) await pool.connect();

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    try {
      // 2️⃣ Chuẩn bị TVP
      const guestListTVP = new sql.Table("TVP_GuestList");
      guestListTVP.columns.add("FullName", sql.NVarChar(100));
      guestListTVP.columns.add("CMND", sql.VarChar(12));
      guestListTVP.columns.add("IsLeader", sql.VarChar(3));

      guests.forEach(g => {
        guestListTVP.rows.add(g.fullName, g.cmnd || "", g.isLeader === "Yes" ? "Yes" : "No");
      });

      const staffAccountID = req.user?.accountId || 1;
      console.log("StaffAccountID passed to SP:", staffAccountID, typeof staffAccountID);

      // 3️⃣ Gọi SP tạo Account + Group + Guests
      let spResult;
      try {
        spResult = await request
          .input("StaffAccountID", sql.Int, staffAccountID)
          .input("GuestList", guestListTVP)
          .execute("sp_CreateGuestGroupAccount");
      } catch (spErr) {
        console.error("SP CreateGuestGroupAccount error:", spErr);
        await transaction.rollback();
        return res.status(500).json({ message: "Lỗi khi tạo Guest Group/Account: " + spErr.message });
      }

      const { Username, Password, GroupID } = spResult.recordset[0];

      // 4️⃣ Tạo BookingTransaction
      let insertTransResult;
      try {
        insertTransResult = await request
          .input("GroupID", sql.Int, GroupID)
          .input("StaffID", sql.Int, staffAccountID)
          .input("StartDate", sql.DateTime, startDate)
          .input("EndDate", sql.DateTime, endDate)
          .input("Status", sql.NVarChar(50), status)
          .query(`
            INSERT INTO BookingTransaction (GroupID, StaffID, StartDate, EndDate, TotalPrice, Status)
            OUTPUT INSERTED.TransactionID
            VALUES (@GroupID, @StaffID, @StartDate, @EndDate, 0, @Status)
          `);
      } catch (transErr) {
        console.error("BookingTransaction insert error:", transErr);
        await transaction.rollback();
        return res.status(500).json({ message: "Lỗi khi tạo BookingTransaction: " + transErr.message });
      }

      const transactionID = insertTransResult.recordset[0].TransactionID;

      // 5️⃣ Commit transaction
      await transaction.commit();

      // 6️⃣ Trả kết quả
      res.status(201).json({
        message: "Guest group, account, guests và booking đã tạo thành công",
        data: { Username, Password, GroupID, transactionID },
      });

    } catch (errInner) {
      if (transaction._aborted !== true && transaction._rollbackPending !== true) {
        await transaction.rollback();
      }
      console.error("Unexpected transaction error:", errInner);
      return res.status(500).json({ message: errInner.message });
    }

  } catch (errOuter) {
    console.error("Database connection error:", errOuter);
    res.status(500).json({ message: "Lỗi kết nối DB: " + errOuter.message });
  }
};
