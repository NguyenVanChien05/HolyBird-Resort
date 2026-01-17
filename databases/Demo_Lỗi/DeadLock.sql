
--------------------------------
-- Thêm bồi thường
----------------------------------
Create PROCEDURE sp_AddCompensation
(
    @TransactionID INT,
    @Compensation_Amount MONEY,
    @Reason NVARCHAR(255) = NULL,
    @CreatedBy INT
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

		--SELECT 1
		--FROM BookingTransaction WITH (UPDLOCK)
		--WHERE TransactionID = @TransactionID;

        IF @Compensation_Amount <= 0
            THROW 50010, N'Số tiền bồi thường phải > 0', 1;

        IF NOT EXISTS (
            SELECT 1 FROM BookingTransaction WHERE TransactionID = @TransactionID
        )
            THROW 50011, N'Không tồn tại Transaction', 1;

        -- Validate staff
        IF NOT EXISTS (
            SELECT 1 FROM Staff WHERE StaffID = @CreatedBy
        )
            THROW 50012, N'Staff không tồn tại', 1;

        -- 1 Insert Compensation
        INSERT INTO Compensation
        (
            TransactionID,
            Compensation_Amount,
            Reason,
            CreatedBy
        )
        VALUES
        (
            @TransactionID,
            @Compensation_Amount,
            @Reason,
            @CreatedBy
        );
		
        WAITFOR DELAY '00:00:10';

        EXEC sp_UpdateTransactionTotalPrice @TransactionID;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO


-----------------------------------------
-- Tự động chọn phòng thích hợp và thêm BookingDetail
------------------------------------------
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


