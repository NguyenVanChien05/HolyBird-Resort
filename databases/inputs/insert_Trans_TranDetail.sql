USE Holybird_Resort_db
GO

DECLARE @i INT = 1;
DECLARE @TransactionID INT;
DECLARE @GroupID INT;
DECLARE @StaffID INT;
DECLARE @StartDate DATETIME;
DECLARE @EndDate DATETIME;
DECLARE @TransStatus VARCHAR(20);

DECLARE @DetailCount INT;
DECLARE @RoomID INT;
DECLARE @GuestID INT;
DECLARE @CheckIn DATETIME;
DECLARE @CheckOut DATETIME;
DECLARE @CurrentPrice MONEY;
DECLARE @LineTotal MONEY;
DECLARE @DetailStatus VARCHAR(20);

WHILE @i <= 20
BEGIN
    -- Random Group
    SELECT TOP 1 @GroupID = GroupID FROM GuestGroup ORDER BY NEWID();

    -- Random Staff
    SELECT TOP 1 @StaffID = StaffID FROM Staff ORDER BY NEWID();

    -- Random ngày
    SET @StartDate = DATEADD(DAY, ABS(CHECKSUM(NEWID())) % 10, GETDATE());
    SET @EndDate   = DATEADD(DAY, ABS(CHECKSUM(NEWID())) % 5 + 1, @StartDate);

    -- Random status transaction
    SET @TransStatus =
        CASE ABS(CHECKSUM(NEWID())) % 3
            WHEN 0 THEN 'Pending'
            WHEN 1 THEN 'Completed'
            ELSE 'Cancelled'
        END;

    INSERT INTO BookingTransaction (
        GroupID, StaffID, StartDate, EndDate, Status
    )
    VALUES (
        @GroupID, @StaffID, @StartDate, @EndDate, @TransStatus
    );

    SET @TransactionID = SCOPE_IDENTITY();

    -- Random số detail: 1–10
    SET @DetailCount = ABS(CHECKSUM(NEWID())) % 10 + 1;

    WHILE @DetailCount > 0
    BEGIN
        SELECT TOP 1 
            @RoomID = r.RoomID,
            @CurrentPrice = pr.Price
        FROM Room r
        JOIN PriceRoom pr
            ON pr.RankID = r.RankID
           AND pr.TypeID = r.TypeID
        ORDER BY NEWID();

        SELECT TOP 1 @GuestID = GuestID FROM Guest ORDER BY NEWID();

        SET @CheckIn  = @StartDate;
        SET @CheckOut = @EndDate;

        SET @LineTotal = DATEDIFF(DAY, @CheckIn, @CheckOut) * @CurrentPrice;

        SET @DetailStatus =
            CASE ABS(CHECKSUM(NEWID())) % 4
                WHEN 0 THEN 'Booked'
                WHEN 1 THEN 'CheckedIn'
                WHEN 2 THEN 'CheckedOut'
                ELSE 'Cancelled'
            END;

        INSERT INTO BookingDetail (
            TransactionID,
            RoomID,
            GuestID,
            CheckInDate,
            CheckOutDate,
            CurrentPrice,
            LineTotal,
            Compensation,
            Status
        )
        VALUES (
            @TransactionID,
            @RoomID,
            @GuestID,
            @CheckIn,
            @CheckOut,
            @CurrentPrice,
            @LineTotal,
            0,
            @DetailStatus
        );

        SET @DetailCount -= 1;
    END

    -- Update TotalPrice
    UPDATE BookingTransaction
    SET TotalPrice = (
        SELECT SUM(LineTotal)
        FROM BookingDetail
        WHERE TransactionID = @TransactionID
    )
    WHERE TransactionID = @TransactionID;

    SET @i += 1;
END;
