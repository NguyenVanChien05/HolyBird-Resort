USE Holybird_Resort_db
GO


DECLARE @i INT = 1;
DECLARE @Status VARCHAR(20);
DECLARE @CardCode VARCHAR(5);

WHILE @i <= 100
BEGIN
    -- Sinh CardCode 5 ch? s? (10000–99999)
    SET @CardCode = CAST(ABS(CHECKSUM(NEWID())) % 90000 + 10000 AS VARCHAR(5));

    -- Lost kho?ng 1/10
    SET @Status =
        CASE ABS(CHECKSUM(NEWID())) % 10
            WHEN 0 THEN 'Lost'
            ELSE 'Disabled'
        END;

    -- ??m b?o CardCode không trùng
    IF NOT EXISTS (
        SELECT 1 FROM KeyCard WHERE CardCode = @CardCode
    )
    BEGIN
        INSERT INTO KeyCard (
            RoomID,
            DetailID,
            CardCode,
            IssueDate,
            ExpireDate,
            Status
        )
        VALUES (
            NULL,
            NULL,
            @CardCode,
            GETDATE(),
            NULL,
            @Status
        );

        SET @i += 1;
    END
END;

