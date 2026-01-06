USE HolybirdResort
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
END
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
END
GO


SELECT bt.TransactionID, bt.GroupID, gg.AccountID
FROM BookingTransaction bt
JOIN GuestGroup gg ON bt.GroupID = gg.GroupID
WHERE bt.TransactionID = 3


CREATE PROCEDURE sp_GetBookingTransactionDetail
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Booking details + Guest + GuestGroup + Room
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
    -- LEFT JOIN GuestGroup gg ON gg.GroupID = ggd.GroupID  -- nếu muốn lấy thêm AccountID
    WHERE bd.TransactionID = @TransactionID;

    -- Key cards
    SELECT 
        kc.CardID,
        kc.DetailID,
        kc.CardCode,
        kc.Status
    FROM KeyCard kc
    INNER JOIN BookingDetail bd ON bd.DetailID = kc.DetailID
    WHERE bd.TransactionID = @TransactionID;
END


CREATE PROCEDURE sp_GetRoomRanks
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        RankID,
        RankName
    FROM RankRoom
    ORDER BY RankName;
END
GO

CREATE PROCEDURE sp_GetRoomTypes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        TypeID,
        TypeName,
        Capacity
    FROM RoomType
    ORDER BY Capacity, TypeName;
END
GO

CREATE PROCEDURE sp_GetFloors
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        FloorNumber
    FROM Room
    ORDER BY FloorNumber;
END
GO

 
drop PROCEDURE sp_FindAvailableRooms
CREATE OR ALTER PROCEDURE sp_FindAvailableRooms
    @RankID INT,
    @TypeID INT,
    @FloorNumber INT = NULL,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        R.RoomID,
        R.RoomNumber,
        R.FloorNumber,
        PR.Price
    FROM Room R
    JOIN PriceRoom PR
        ON R.RankID = PR.RankID
       AND R.TypeID = PR.TypeID
    WHERE
        R.RankID = @RankID
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


GO
-- C?p nh?t TotalPrice 
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
END


-- 
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

ALTER TABLE BookingRequest
ADD PeopleCount INT NOT NULL DEFAULT 1;
GO

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BookingRequest';




-- T?o Booking Detail
DROP PROCEDURE IF EXISTS sp_CreateBookingDetail;
GO
CREATE PROCEDURE sp_CreateBookingDetail
(
    @TransactionID INT,
    @Requests TVP_BookingRequest READONLY
)
AS
BEGIN
    INSERT INTO BookingRequest
    (
        TransactionID,
        RankID,
        TypeID,
        FloorNumber,
        RoomCount,
		PeopleCount,
        CheckInDate,
        CheckOutDate
    )
    SELECT
        @TransactionID,
        RankID,
        TypeID,
        FloorNumber,
        RoomCount,
		PeopleCount,
        CheckInDate,
        CheckOutDate
    FROM @Requests;
END;


DROP PROCEDURE IF EXISTS sp_AutoAssignRoom;
GO

CREATE PROCEDURE sp_AutoAssignRoom
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE
            @RequestID INT,
            @RankID INT,
            @TypeID INT,
            @Floor INT,
            @RoomCount INT,
            @PeopleCount INT,
            @CheckIn DATE,
            @CheckOut DATE,
            @RoomID INT,
            @Price MONEY,
            @Nights INT,
            @i INT,
            @j INT;

        -- Cursor lấy tất cả request chưa xử lý
        DECLARE req_cursor CURSOR LOCAL FOR
        SELECT
            RequestID,
            RankID,
            TypeID,
            FloorNumber,
            RoomCount,
            PeopleCount,
            CheckInDate,
            CheckOutDate
        FROM BookingRequest
        WHERE TransactionID = @TransactionID
          AND Status = 'Pending';

        OPEN req_cursor;
        FETCH NEXT FROM req_cursor
        INTO @RequestID, @RankID, @TypeID, @Floor, @RoomCount, @PeopleCount, @CheckIn, @CheckOut;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @Nights = DATEDIFF(DAY, @CheckIn, @CheckOut);

            -- Lấy giá phòng
            SELECT @Price = Price
            FROM PriceRoom
            WHERE RankID = @RankID AND TypeID = @TypeID;

            IF @Price IS NULL
                THROW 50001, N'Không tìm thấy giá phòng', 1;

            -- Lấy tất cả phòng trống đủ số phòng yêu cầu
            DECLARE @AvailableRooms TABLE (
                RowNum INT IDENTITY(1,1),
                RoomID INT,
                RoomNumber INT,
                FloorNumber INT,
                Price MONEY
            );

            INSERT INTO @AvailableRooms (RoomID, RoomNumber, FloorNumber, Price)
            EXEC sp_FindAvailableRooms @RankID, @TypeID, @Floor, @CheckIn, @CheckOut;

            -- Kiểm tra đủ số phòng không
            IF (SELECT COUNT(*) FROM @AvailableRooms) < @RoomCount
                THROW 50002, N'Không đủ phòng trống', 1;

            -- Lặp qua từng phòng
            SET @i = 1;
            WHILE @i <= @RoomCount
            BEGIN
                SELECT @RoomID = RoomID
                FROM @AvailableRooms
                WHERE RowNum = @i;

                -- Lặp theo số người trong phòng
                SET @j = 0;
                WHILE @j < @PeopleCount
                BEGIN
                    INSERT INTO BookingDetail
                    (
                        TransactionID,
                        RoomID,
                        CheckInDate,
                        CheckOutDate,
                        CurrentPrice,
                        LineTotal,
                        Status
                    )
                    VALUES
                    (
                        @TransactionID,
                        @RoomID,
                        @CheckIn,
                        @CheckOut,
                        @Price,
                        @Price * @Nights,
                        'Booked'
                    );

                    SET @j += 1;
                END

                SET @i += 1;
            END

            -- Cập nhật request đã xử lý
            UPDATE BookingRequest
            SET Status = 'Processed'
            WHERE RequestID = @RequestID;

            FETCH NEXT FROM req_cursor
            INTO @RequestID, @RankID, @TypeID, @Floor, @RoomCount, @PeopleCount, @CheckIn, @CheckOut;
        END

        CLOSE req_cursor;
        DEALLOCATE req_cursor;

        -- Cập nhật tổng tiền transaction
        EXEC sp_UpdateTransactionTotalPrice @TransactionID;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

DROP PROCEDURE IF EXISTS sp_AssignGuestToRoom;
GO
CREATE PROCEDURE sp_AssignGuestToRoom
(
    @TransactionID INT,
    @Guests TVP_Guest READONLY
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE 
            @DetailID INT,
            @GuestID INT,
            @FullName NVARCHAR(100),
            @CMND VARCHAR(12);

        /* ===== Cursor detail chưa có guest ===== */
        DECLARE detail_cursor CURSOR LOCAL FOR
        SELECT DetailID
        FROM BookingDetail
        WHERE TransactionID = @TransactionID
          AND GuestID IS NULL
        ORDER BY DetailID;

        /* ===== Cursor guest ===== */
        DECLARE guest_cursor CURSOR LOCAL FOR
        SELECT FullName, CMND
        FROM @Guests;

        OPEN detail_cursor;
        OPEN guest_cursor;

        FETCH NEXT FROM detail_cursor INTO @DetailID;
        FETCH NEXT FROM guest_cursor INTO @FullName, @CMND;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            /* 1️⃣ Insert Guest */
            INSERT INTO Guest (FullName, CMND)
            VALUES (@FullName, @CMND);

            SET @GuestID = SCOPE_IDENTITY();

            /* 2️⃣ Gán Guest cho BookingDetail */
            UPDATE BookingDetail
            SET GuestID = @GuestID
            WHERE DetailID = @DetailID;

            FETCH NEXT FROM detail_cursor INTO @DetailID;
            FETCH NEXT FROM guest_cursor INTO @FullName, @CMND;
        END

        CLOSE detail_cursor;
        DEALLOCATE detail_cursor;
        CLOSE guest_cursor;
        DEALLOCATE guest_cursor;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO


SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BookingDetail';




-- Xóa sp cũ
DROP PROCEDURE IF EXISTS sp_CheckIn;

CREATE PROCEDURE sp_CheckIn
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoomID INT;
    DECLARE @CheckOutDate DATETIME;

    -- Lấy RoomID và CheckOutDate từ BookingDetail
    SELECT 
        @RoomID = RoomID,
        @CheckOutDate = CheckOutDate
    FROM BookingDetail
    WHERE DetailID = @DetailID;

    IF @RoomID IS NULL
    BEGIN
        RAISERROR('BookingDetail không tồn tại',16,1);
        RETURN;
    END

    -- Cập nhật trạng thái BookingDetail
    UPDATE BookingDetail
    SET Status = 'CheckedIn'
    WHERE DetailID = @DetailID;

    -- Cập nhật trạng thái phòng
    UPDATE Room
    SET StatusPhysic = 'Busy'
    WHERE RoomID = @RoomID;

    -- Gán KeyCard sẵn cho phòng này
    UPDATE KeyCard
    SET DetailID = @DetailID,
        Status = 'Active',
        ExpireDate = @CheckOutDate
    WHERE RoomID = @RoomID;
END
GO

-- Xóa sp cũ
DROP PROCEDURE IF EXISTS sp_CheckOut;

CREATE PROCEDURE sp_CheckOut
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoomID INT;

    SELECT @RoomID = RoomID
    FROM BookingDetail
    WHERE DetailID = @DetailID;

    IF @RoomID IS NULL
    BEGIN
        RAISERROR('BookingDetail không tồn tại',16,1);
        RETURN;
    END

    -- Cập nhật trạng thái BookingDetail
    UPDATE BookingDetail
    SET Status = 'CheckedOut'
    WHERE DetailID = @DetailID;

    -- Trả phòng
    UPDATE Room
    SET StatusPhysic = 'Free'
    WHERE RoomID = @RoomID;

    -- Hết hạn KeyCard
    UPDATE KeyCard
    SET Status = 'Expired',
        DetailID = NULL,
        ExpireDate = GETDATE()
    WHERE RoomID = @RoomID;
END
GO

DROP PROCEDURE IF EXISTS sp_DeleteBookingDetail;
GO

CREATE PROCEDURE sp_DeleteBookingDetail
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoomID INT;
    DECLARE @CurrentStatus VARCHAR(20);

    -- Lấy RoomID và Status hiện tại
    SELECT 
        @RoomID = RoomID,
        @CurrentStatus = Status
    FROM BookingDetail
    WHERE DetailID = @DetailID;

    IF @RoomID IS NULL
    BEGIN
        RAISERROR('BookingDetail không tồn tại',16,1);
        RETURN;
    END

    -- Chỉ cho xóa nếu chưa CheckIn
    IF @CurrentStatus = 'CheckedIn' OR @CurrentStatus = 'CheckedOut'
    BEGIN
        RAISERROR('Chi tiết này đã CheckIn hoặc CheckOut, không được xóa',16,1);
        RETURN;
    END

    -- Xóa tất cả KeyCard liên quan (nếu có)
    DELETE FROM KeyCard
    WHERE DetailID = @DetailID;

    -- Xóa BookingDetail
    DELETE FROM BookingDetail
    WHERE DetailID = @DetailID;
END
GO
