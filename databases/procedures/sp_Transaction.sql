USE Holybird_Resort_db;
GO

DROP PROCEDURE IF EXISTS sp_GetMyTransaction;
GO
CREATE PROCEDURE sp_GetMyTransaction
    @AccountID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bt.TransactionID,
        bt.StartDate,
        bt.EndDate,
        bt.TotalPrice,
        bt.Status
    FROM BookingTransaction bt
    JOIN GuestGroup gg ON bt.GroupID = gg.GroupID
    JOIN Account a ON gg.AccountID = a.AccountID
    WHERE a.AccountID = @AccountID;
END;
GO

DROP PROCEDURE IF EXISTS sp_GetAllTransactions;
GO
CREATE PROCEDURE sp_GetAllTransactions
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        bt.TransactionID,
        bt.GroupID,
        bt.StartDate,
        bt.EndDate,
        bt.TotalPrice,
        bt.Status,
        s.StaffName
    FROM BookingTransaction bt
    JOIN Staff s ON bt.StaffID = s.StaffID
    ORDER BY bt.TransactionID DESC;
END;
GO

DROP PROCEDURE IF EXISTS sp_GetBookingTransactionDetail;
GO
CREATE PROCEDURE sp_GetBookingTransactionDetail
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        bd.DetailID,
        bd.TransactionID,
        bd.RoomID,
        r.RoomNumber,
        r.FloorNumber,
        ggd.GroupID,
        gu.FullName,
        gu.CMND,
        bd.CheckInDate,
        bd.CheckOutDate,
        bd.CurrentPrice,
        bd.LineTotal,
        bd.Status
    FROM BookingDetail bd
    LEFT JOIN Room r ON r.RoomID = bd.RoomID
    LEFT JOIN Guest gu ON gu.GuestID = bd.GuestID
    LEFT JOIN GuestGroup_Detail ggd ON ggd.GuestID = bd.GuestID
    WHERE bd.TransactionID = @TransactionID;

    SELECT 
        kc.CardID,
        kc.DetailID,
        kc.CardCode,
        kc.Status
    FROM KeyCard kc
    INNER JOIN BookingDetail bd ON bd.DetailID = kc.DetailID
    WHERE bd.TransactionID = @TransactionID;
END;
GO

DROP PROCEDURE IF EXISTS sp_GetRoomRanks;
GO
CREATE PROCEDURE sp_GetRoomRanks
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RankID, RankName
    FROM RankRoom
    ORDER BY RankName;
END;
GO

DROP PROCEDURE IF EXISTS sp_GetRoomTypes;
GO
CREATE PROCEDURE sp_GetRoomTypes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TypeID, TypeName, Capacity
    FROM RoomType
    ORDER BY Capacity, TypeName;
END;
GO

DROP PROCEDURE IF EXISTS sp_GetFloors;
GO
CREATE PROCEDURE sp_GetFloors
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT FloorNumber
    FROM Room
    ORDER BY FloorNumber;
END;
GO

DROP PROCEDURE IF EXISTS sp_FindAvailableRooms;
GO
CREATE OR ALTER PROCEDURE sp_FindAvailableRooms
    @RankID INT,
    @TypeID INT,
    @FloorNumber INT = NULL,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT R.RoomID, R.RoomNumber, R.FloorNumber, PR.Price
    FROM Room R
    JOIN PriceRoom PR ON R.RankID = PR.RankID AND R.TypeID = PR.TypeID
    WHERE R.RankID = @RankID
      AND R.TypeID = @TypeID
      AND (@FloorNumber IS NULL OR R.FloorNumber = @FloorNumber)
      AND R.StatusPhysic = 'Free'
      AND NOT EXISTS (
          SELECT 1
          FROM BookingDetail BD
          WHERE BD.RoomID = R.RoomID
            AND BD.Status IN ('Booked','CheckedIn')
            AND BD.CheckInDate < @EndDate
            AND BD.CheckOutDate > @StartDate
      )
    ORDER BY R.FloorNumber, R.RoomNumber;
END;
GO

DROP PROCEDURE IF EXISTS sp_UpdateTransactionTotalPrice;
GO
CREATE PROCEDURE sp_UpdateTransactionTotalPrice
    @TransactionID INT
AS
BEGIN
    UPDATE BookingTransaction
    SET TotalPrice = (
        SELECT SUM(LineTotal)
        FROM BookingDetail
        WHERE TransactionID = @TransactionID
          AND Status <> 'Cancelled'
    )
    WHERE TransactionID = @TransactionID;
END;
GO

DROP TYPE IF EXISTS TVP_BookingRequest;
GO
CREATE TYPE TVP_BookingRequest AS TABLE
(
    RankID INT,
    TypeID INT,
    FloorNumber INT,
    RoomCount INT,
    PeopleCount INT,
    CheckInDate DATE,
    CheckOutDate DATE
);
GO

ALTER TABLE BookingRequest ADD PeopleCount INT NOT NULL DEFAULT 1;
GO

DROP PROCEDURE IF EXISTS sp_CreateBookingDetail;
GO
CREATE PROCEDURE sp_CreateBookingDetail
(
    @TransactionID INT,
    @Requests TVP_BookingRequest READONLY
)
AS
BEGIN
    INSERT INTO BookingRequest(TransactionID, RankID, TypeID, FloorNumber, RoomCount, PeopleCount, CheckInDate, CheckOutDate)
    SELECT @TransactionID, RankID, TypeID, FloorNumber, RoomCount, PeopleCount, CheckInDate, CheckOutDate
    FROM @Requests;
END;
GO

DROP PROCEDURE IF EXISTS sp_AutoAssignRoom;
GO
CREATE PROCEDURE sp_AutoAssignRoom
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @RequestID INT, @RankID INT, @TypeID INT, @Floor INT,
                @RoomCount INT, @PeopleCount INT, @CheckIn DATE, @CheckOut DATE,
                @RoomID INT, @Price MONEY, @Nights INT, @i INT, @j INT;

        DECLARE req_cursor CURSOR LOCAL FOR
        SELECT RequestID, RankID, TypeID, FloorNumber, RoomCount, PeopleCount, CheckInDate, CheckOutDate
        FROM BookingRequest
        WHERE TransactionID = @TransactionID AND Status = 'Pending';

        OPEN req_cursor;
        FETCH NEXT FROM req_cursor INTO @RequestID, @RankID, @TypeID, @Floor, @RoomCount, @PeopleCount, @CheckIn, @CheckOut;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @Nights = DATEDIFF(DAY, @CheckIn, @CheckOut);

            SELECT @Price = Price
            FROM PriceRoom
            WHERE RankID = @RankID AND TypeID = @TypeID;

            IF @Price IS NULL THROW 50001, N'Không tìm thấy giá phòng', 1;

            DECLARE @AvailableRooms TABLE (RowNum INT IDENTITY(1,1), RoomID INT, RoomNumber INT, FloorNumber INT, Price MONEY);
            INSERT INTO @AvailableRooms (RoomID, RoomNumber, FloorNumber, Price)
            EXEC sp_FindAvailableRooms @RankID, @TypeID, @Floor, @CheckIn, @CheckOut;

            IF (SELECT COUNT(*) FROM @AvailableRooms) < @RoomCount
                THROW 50002, N'Không đủ phòng trống', 1;

            SET @i = 1;
            WHILE @i <= @RoomCount
            BEGIN
                SELECT @RoomID = RoomID FROM @AvailableRooms WHERE RowNum = @i;
                SET @j = 0;
                WHILE @j < @PeopleCount
                BEGIN
                    INSERT INTO BookingDetail(TransactionID, RoomID, CheckInDate, CheckOutDate, CurrentPrice, LineTotal, Status)
                    VALUES(@TransactionID, @RoomID, @CheckIn, @CheckOut, @Price, @Price * @Nights, 'Booked');
                    SET @j += 1;
                END
                SET @i += 1;
            END

            UPDATE BookingRequest SET Status = 'Processed' WHERE RequestID = @RequestID;

            FETCH NEXT FROM req_cursor INTO @RequestID, @RankID, @TypeID, @Floor, @RoomCount, @PeopleCount, @CheckIn, @CheckOut;
        END

        CLOSE req_cursor;
        DEALLOCATE req_cursor;

        EXEC sp_UpdateTransactionTotalPrice @TransactionID;
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

DROP PROCEDURE IF EXISTS sp_CheckIn;
GO
CREATE PROCEDURE sp_CheckIn
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RoomID INT, @CheckOutDate DATETIME;

    SELECT @RoomID = RoomID, @CheckOutDate = CheckOutDate FROM BookingDetail WHERE DetailID = @DetailID;
    IF @RoomID IS NULL RAISERROR('BookingDetail không tồn tại',16,1);

    UPDATE BookingDetail SET Status = 'CheckedIn' WHERE DetailID = @DetailID;
    UPDATE Room SET StatusPhysic = 'Busy' WHERE RoomID = @RoomID;
    UPDATE KeyCard SET DetailID = @DetailID, Status = 'Active', ExpireDate = @CheckOutDate WHERE RoomID = @RoomID;
END;
GO

DROP PROCEDURE IF EXISTS sp_CheckOut;
GO
CREATE PROCEDURE sp_CheckOut
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RoomID INT;
    SELECT @RoomID = RoomID FROM BookingDetail WHERE DetailID = @DetailID;
    IF @RoomID IS NULL RAISERROR('BookingDetail không tồn tại',16,1);

    UPDATE BookingDetail SET Status = 'CheckedOut' WHERE DetailID = @DetailID;
    UPDATE Room SET StatusPhysic = 'Free' WHERE RoomID = @RoomID;
    UPDATE KeyCard SET Status = 'Expired', DetailID = NULL, ExpireDate = GETDATE() WHERE RoomID = @RoomID;
END;
GO

DROP PROCEDURE IF EXISTS sp_DeleteBookingDetail;
GO
CREATE PROCEDURE sp_DeleteBookingDetail
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RoomID INT, @CurrentStatus VARCHAR(20);

    SELECT @RoomID = RoomID, @CurrentStatus = Status FROM BookingDetail WHERE DetailID = @DetailID;
    IF @RoomID IS NULL RAISERROR('BookingDetail không tồn tại',16,1);
    IF @CurrentStatus IN ('CheckedIn','CheckedOut') RAISERROR('Chi tiết đã CheckIn/CheckOut, không được xóa',16,1);

    DELETE FROM KeyCard WHERE DetailID = @DetailID;
    DELETE FROM BookingDetail WHERE DetailID = @DetailID;
END;
GO
