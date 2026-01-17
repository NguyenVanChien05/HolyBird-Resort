USE HolybirdResort
GO

-- =============================================
-- 1. sp_GetAllRooms (Để hiện danh sách phòng)
-- =============================================
IF OBJECT_ID('sp_GetAllRooms', 'P') IS NOT NULL DROP PROCEDURE sp_GetAllRooms;
GO

CREATE PROCEDURE sp_GetAllRooms
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.RoomID, 
        r.RoomNumber, 
        r.FloorNumber, 
        r.StatusPhysic,
        rk.RankName, 
        rk.RankID,
        rt.TypeName, 
        rt.TypeID,
        rt.Capacity, 
        ISNULL(pr.Price, 0) as Price -- Tránh null nếu chưa set giá
    FROM Room r
    LEFT JOIN RankRoom rk ON r.RankID = rk.RankID
    LEFT JOIN RoomType rt ON r.TypeID = rt.TypeID
    LEFT JOIN PriceRoom pr ON r.RankID = pr.RankID AND r.TypeID = pr.TypeID
    ORDER BY r.FloorNumber, r.RoomNumber;
END
GO

-- =============================================
-- 2. sp_UpdateRoomStatus (Admin/Staff đổi trạng thái phòng)
-- =============================================
IF OBJECT_ID('sp_UpdateRoomStatus', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateRoomStatus;
GO

CREATE PROCEDURE sp_UpdateRoomStatus
    @RoomID INT,
    @StatusPhysic NVARCHAR(50),
    @Role NVARCHAR(50) -- Backend truyền vào để check quyền
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Room 
    SET StatusPhysic = @StatusPhysic 
    WHERE RoomID = @RoomID;
    
    SELECT 'Success' as Message;
END
GO

-- =============================================
-- 3. sp_UpdateRoomPrice (Admin cập nhật giá)
-- =============================================
IF OBJECT_ID('sp_UpdateRoomPrice', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateRoomPrice;
GO

CREATE PROCEDURE sp_UpdateRoomPrice
    @RankID INT,
    @TypeID INT,
    @Price MONEY,
    @Role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem đã có giá cho cặp Rank-Type này chưa
    IF EXISTS (SELECT 1 FROM PriceRoom WHERE RankID = @RankID AND TypeID = @TypeID)
    BEGIN
        UPDATE PriceRoom 
        SET Price = @Price 
        WHERE RankID = @RankID AND TypeID = @TypeID;
    END
    ELSE
    BEGIN
        INSERT INTO PriceRoom (RankID, TypeID, Price)
        VALUES (@RankID, @TypeID, @Price);
    END
    
    SELECT 'Price updated successfully' as Message;
END
GO





