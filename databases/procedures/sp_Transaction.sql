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

select* from GuestGroup_Detail g where g.GroupID = 110
select* from BookingDetail b where b.TransactionID = 20
exec sp_GetBookingTransactionDetail 20
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

exec sp_FindAvailableRooms 1, 1, NULL, '2026-01-01', '2026-01-02'
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
    BEGIN TRAN;

    SELECT R.RoomID, R.RoomNumber, R.FloorNumber, PR.Price
    FROM Room R WITH (UPDLOCK, HOLDLOCK)
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

	COMMIT;
END;
GO


DROP PROCEDURE IF EXISTS sp_UpdateTransactionTotalPrice;
GO
CREATE PROCEDURE sp_UpdateTransactionTotalPrice
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE BookingTransaction
    SET TotalPrice =
    (
        -- Tiền phòng
        ISNULL((
            SELECT SUM(LineTotal)
            FROM BookingDetail
            WHERE TransactionID = @TransactionID
              AND Status <> 'Cancelled'
        ), 0)
        +
        -- Tiền bồi thường
        ISNULL((
            SELECT SUM(Compensation_Amount)
            FROM Compensation
            WHERE TransactionID = @TransactionID
              AND Status = 'Active'
        ), 0)
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

		--SELECT 1
        --FROM BookingTransaction WITH (UPDLOCK, HOLDLOCK)
        --WHERE TransactionID = @TransactionID;


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

			WAITFOR DELAY '00:00:10';

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


CREATE TYPE TVP_Guest AS TABLE
(
    FullName NVARCHAR(100) NULL,
    CMND VARCHAR(12) NULL
);
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

        /* Cursor BookingDetail */
        DECLARE detail_cursor CURSOR LOCAL FOR
        SELECT DetailID
        FROM BookingDetail
        WHERE TransactionID = @TransactionID
          AND GuestID IS NULL
        ORDER BY DetailID;

        /* Cursor Guest input */
        DECLARE guest_cursor CURSOR LOCAL FOR
        SELECT FullName, CMND
        FROM @Guests;

        OPEN detail_cursor;
        OPEN guest_cursor;

        FETCH NEXT FROM detail_cursor INTO @DetailID;
        FETCH NEXT FROM guest_cursor INTO @FullName, @CMND;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            /* 1️⃣ Nếu không nhập gì → bỏ qua (sẽ xóa detail sau) */
            IF (@FullName IS NULL AND @CMND IS NULL)
            BEGIN
                FETCH NEXT FROM detail_cursor INTO @DetailID;
                FETCH NEXT FROM guest_cursor INTO @FullName, @CMND;
                CONTINUE;
            END

            /* 2️⃣ Có nhập → bắt buộc tìm Guest */

            SET @GuestID = NULL;
			DECLARE @GroupID INT
			SELECT @GroupID = GroupID
				FROM BookingTransaction
				WHERE TransactionID = @TransactionID;

            SELECT TOP 1 @GuestID = G.GuestID
            FROM Guest G
            INNER JOIN GuestGroup_Detail GGD
                ON GGD.GuestID = G.GuestID
               AND GGD.GroupID = @GroupID
            WHERE 
                (G.CMND = @CMND AND @CMND IS NOT NULL)
                AND DIFFERENCE(G.FullName, @FullName) >= 4;

            /* 3️⃣ Sai thông tin → BÁO LỖI */
            IF @GuestID IS NULL
			BEGIN
				DECLARE @ErrorMsg NVARCHAR(300);

				SET @ErrorMsg = N'Thông tin khách không hợp lệ hoặc không thuộc group: '
					+ ISNULL(@FullName, N'[Không có tên]')
					+ N' - CMND: '
					+ ISNULL(@CMND, N'[Không có CMND]');

				THROW 50010, @ErrorMsg, 1;
			END

			/* 3️⃣.2 Kiểm tra Guest đã có detail trong CHÍNH transaction này chưa */
			IF EXISTS (
				SELECT 1
				FROM BookingDetail
				WHERE TransactionID = @TransactionID
				  AND GuestID = @GuestID
			)
			BEGIN
				DECLARE @ErrorMsg3 NVARCHAR(300);

				SET @ErrorMsg3 = N'Khách đã được gán phòng trong giao dịch này: '
					+ ISNULL(@FullName, N'[Không có tên]')
					+ N' - CMND: '
					+ ISNULL(@CMND, N'[Không có CMND]');

				THROW 50012, @ErrorMsg3, 1;
			END


            /* 4️⃣ Gán Guest */
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
        IF @@TRANCOUNT > 0
            ROLLBACK;

        DECLARE @Msg NVARCHAR(4000);
        SET @Msg = ERROR_MESSAGE();
        THROW 50000, @Msg, 1;
    END CATCH
END;
GO

DROP PROCEDURE IF EXISTS sp_CheckIn;
GO
Create PROCEDURE sp_CheckIn
    @DetailID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoomID INT, @CheckOutDate DATETIME, @CardID INT;

	BEGIN TRY
        BEGIN TRAN;
		/* 1️⃣ Lấy thông tin booking */
		SELECT 
			@RoomID = RoomID,
			@CheckOutDate = CheckOutDate
		FROM BookingDetail
		WHERE DetailID = @DetailID;

		IF @RoomID IS NULL
		BEGIN
			RAISERROR(N'BookingDetail không tồn tại',16,1);
			RETURN;
		END

		/* 2️⃣ Update Booking + Room */
		UPDATE BookingDetail
		SET Status = 'CheckedIn'
		WHERE DetailID = @DetailID;

		WAITFOR DELAY '00:00:10';

		UPDATE Room
		SET StatusPhysic = 'Busy'
		WHERE RoomID = @RoomID;

		/* 3️⃣ Lấy KeyCard Disable đầu tiên */
		SELECT TOP (1) @CardID = CardID
		FROM KeyCard
		WHERE Status = 'Disabled'
		ORDER BY CardID ASC;  -- từ trên xuống

		IF @CardID IS NULL
		BEGIN
			RAISERROR(N'Không còn KeyCard Disable cho phòng này',16,1);
			RETURN;
		END

		/* 4️⃣ Update KeyCard được chọn */
		UPDATE KeyCard
		SET DetailID   = @DetailID,
			RoomID     = @RoomID,
			Status     = 'Active',
			ExpireDate = @CheckOutDate
		WHERE CardID = @CardID;

		COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
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
