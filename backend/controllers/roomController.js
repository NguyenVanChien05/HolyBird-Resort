const { sql, pool } = require("../config/db");

// 1. Lấy danh sách tất cả phòng
exports.getAllRooms = async (req, res) => {
    try {
        if (!pool.connected) await pool.connect();
        
        // Gọi SP lấy danh sách phòng (bạn cần đảm bảo đã tạo sp_GetAllRooms trong SQL)
        // Nếu chưa có sp_GetAllRooms, dùng câu Query trực tiếp bên dưới phần catch
        const result = await pool.request().execute("sp_GetAllRooms");
        
        res.json(result.recordset);
    } catch (err) {
        // Fallback: Nếu lỗi gọi SP (do chưa tạo), dùng Query trực tiếp
        console.warn("⚠️ Fallback to Query for getAllRooms");
        try {
             const result = await pool.request().query(`
                SELECT r.*, rk.RankName, rt.TypeName, ISNULL(pr.Price, 0) as Price
                FROM Room r
                LEFT JOIN RankRoom rk ON r.RankID = rk.RankID
                LEFT JOIN RoomType rt ON r.TypeID = rt.TypeID
                LEFT JOIN PriceRoom pr ON r.RankID = pr.RankID AND r.TypeID = pr.TypeID
                ORDER BY r.FloorNumber, r.RoomNumber
            `);
            res.json(result.recordset);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
};

// 2. Lấy danh sách Hạng phòng (Vẫn dùng Query nhanh vì bảng nhỏ)
exports.getRanks = async (req, res) => {
    try {
        if (!pool.connected) await pool.connect();
        const result = await pool.request().query("SELECT * FROM RankRoom");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Lấy danh sách Loại phòng
exports.getTypes = async (req, res) => {
    try {
        if (!pool.connected) await pool.connect();
        const result = await pool.request().query("SELECT * FROM RoomType");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Lấy giá tiền (Cho Guest)
exports.getPrice = async (req, res) => {
    try {
        const { rankID, typeID } = req.query;
        if (!pool.connected) await pool.connect();

        const result = await pool.request()
            .input("RankID", sql.Int, rankID)
            .input("TypeID", sql.Int, typeID)
            .query("SELECT Price FROM PriceRoom WHERE RankID = @RankID AND TypeID = @TypeID");

        if (result.recordset.length > 0) {
            res.json({ price: result.recordset[0].Price });
        } else {
            res.status(404).json({ message: "Chưa có giá cho loại phòng này" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. Cập nhật trạng thái phòng
exports.updateRoomStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status } = req.body;
        
        if (!pool.connected) await pool.connect();
        
        await pool.request()
            .input("RoomID", sql.Int, roomId)
            .input("StatusPhysic", sql.NVarChar, status) 
            .input("Role", sql.VarChar, req.user?.role || "Staff") 
            .execute("sp_UpdateRoomStatus");
            
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
        console.error("Lỗi updateRoomStatus:", err);
        res.status(500).json({ message: err.message });
    }
};

// 3. Cập nhật giá phòng (FIX LỖI 500)
exports.updateRoomPrice = async (req, res) => {
    try {
        const { RankID, TypeID, Price } = req.body;

        // Validation cơ bản
        if (!RankID || !TypeID || !Price) {
            return res.status(400).json({ message: "Thiếu thông tin RankID, TypeID hoặc Price" });
        }

        if (!pool.connected) await pool.connect();

        // Lấy Role từ token, nếu không có thì mặc định là Admin (để tránh lỗi crash)
        const userRole = req.user && req.user.role ? req.user.role : "Admin";

        await pool.request()
            .input("RankID", sql.Int, RankID)
            .input("TypeID", sql.Int, TypeID)
            .input("Price", sql.Money, Price)
            .input("Role", sql.NVarChar, userRole) // Quan trọng: Phải khớp với @Role trong SP
            .execute("sp_UpdateRoomPrice");

        res.json({ message: "Cập nhật giá thành công" });
    } catch (err) {
        console.error("❌ Lỗi updateRoomPrice:", err); // Xem log chi tiết ở Terminal
        res.status(500).json({ message: "Lỗi Server: " + err.message });
    }
};