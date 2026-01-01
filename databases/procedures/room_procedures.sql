USE HolyBirdResort
GO

/* =========================
   GET ALL ROOMS
========================= */
CREATE OR ALTER PROCEDURE sp_GetAllRooms
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.RoomID,
        r.RoomNumber,
        r.FloorNumber,
        r.StatusPhysic,
        rr.RankID,
        rr.RankName,
        rt.TypeID,
        rt.TypeName,
        pr.Price
    FROM Room r
    JOIN RankRoom rr ON r.RankID = rr.RankID
    JOIN RoomType rt ON r.TypeID = rt.TypeID
    LEFT JOIN PriceRoom pr 
        ON pr.RankID = r.RankID 
       AND pr.TypeID = r.TypeID
    ORDER BY r.FloorNumber, r.RoomNumber;
END
GO

/* =========================
   UPDATE ROOM STATUS
========================= */
CREATE PROCEDURE sp_UpdateRoomStatus
    @RoomID INT,
    @StatusPhysic VARCHAR(20),
    @Role VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Role NOT IN ('staff', 'admin')
    BEGIN
        RAISERROR (N'Không có quyền cập nhật trạng thái phòng', 16, 1);
        RETURN;
    END

    UPDATE Room
    SET StatusPhysic = @StatusPhysic
    WHERE RoomID = @RoomID;
END;
GO


/* =========================
   UPDATE PRICE BY RANK + TYPE
========================= */
CREATE PROCEDURE sp_UpdateRoomPrice
    @RankID INT,
    @TypeID INT,
    @Price MONEY,
    @Role VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Role <> 'admin'
    BEGIN
        RAISERROR (N'Chỉ admin được cập nhật giá phòng', 16, 1);
        RETURN;
    END

    UPDATE PriceRoom
    SET Price = @Price
    WHERE RankID = @RankID
      AND TypeID = @TypeID;
END;
GO
