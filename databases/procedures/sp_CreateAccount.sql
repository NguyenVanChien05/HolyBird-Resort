USE Holybird_Resort_db;
GO

CREATE OR ALTER PROCEDURE sp_CheckStaffPermission
(
    @StaffAccountID INT
)
AS
BEGIN
    IF NOT EXISTS (
        WHERE AccountID = @StaffAccountID
          AND Role IN ('Staff', 'Admin')
    )
    BEGIN
        RAISERROR (N'Chỉ Staff hoặc Admin mới có quyền tạo tài khoản đoàn', 16, 1);
    END
END
GO


CREATE OR ALTER PROCEDURE sp_GenerateGuestAccount
(
    @Username VARCHAR(50) OUTPUT,
    @Password VARCHAR(100) OUTPUT,
    @NewAccountID INT OUTPUT
)
AS
BEGIN
    DECLARE @Suffix INT = ABS(CHECKSUM(NEWID())) % 10000;

    SET @Username = 'group' + CAST(@Suffix AS VARCHAR);
    WHILE EXISTS (SELECT 1 FROM Account WHERE Username = @Username)
    BEGIN
        SET @Suffix = @Suffix + 1;
        SET @Username = 'group' + CAST(@Suffix AS VARCHAR);
    END

    SET @Password = 'Guest@' + CAST(@Suffix AS VARCHAR);

    INSERT INTO Account (Username, Password, Role)
    VALUES (@Username, @Password, 'Guest');

    SET @NewAccountID = SCOPE_IDENTITY();
END
GO



CREATE OR ALTER PROCEDURE sp_CreateGuestGroup
(
    @AccountID INT,
    @GroupID INT OUTPUT
)
AS
BEGIN
    INSERT INTO GuestGroup (AccountID)
    VALUES (@AccountID);

    SET @GroupID = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE sp_AddGuestToGroup
(
    @GroupID INT,
    @FullName NVARCHAR(100),
    @CMND VARCHAR(12),
    @IsLeader VARCHAR(3)
)
AS
BEGIN
    DECLARE @GuestID INT;

    INSERT INTO Guest (FullName, CMND)
    VALUES (@FullName, @CMND);

    SET @GuestID = SCOPE_IDENTITY();

    INSERT INTO GuestGroup_Detail (GroupID, GuestID, IsLeader)
    VALUES (@GroupID, @GuestID, CASE WHEN @IsLeader = 'Yes' THEN 1 ELSE 0 END);
END
GO


CREATE TYPE TVP_GuestList AS TABLE (
    FullName NVARCHAR(100),
    CMND VARCHAR(12),
    IsLeader VARCHAR(3) CHECK (IsLeader IN ('Yes','No'))
);
GO


CREATE OR ALTER PROCEDURE sp_AddGuestListToGroup
(
    @GroupID INT,
    @GuestList TVP_GuestList READONLY
)
AS
BEGIN
    DECLARE @FullName NVARCHAR(100),
            @CMND VARCHAR(12),
            @IsLeader VARCHAR(3);

    DECLARE cur CURSOR FOR
        SELECT FullName, CMND, IsLeader FROM @GuestList;

    OPEN cur;
    FETCH NEXT FROM cur INTO @FullName, @CMND, @IsLeader;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC sp_AddGuestToGroup
            @GroupID,
            @FullName,
            @CMND,
            @IsLeader;

        FETCH NEXT FROM cur INTO @FullName, @CMND, @IsLeader;
    END

    CLOSE cur;
    DEALLOCATE cur;
END
GO



CREATE OR ALTER PROCEDURE sp_CreateGuestGroupAccount
(
    @StaffAccountID INT,
    @GuestList TVP_GuestList READONLY
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Username VARCHAR(50),
            @Password VARCHAR(100),
            @AccountID INT,
            @GroupID INT;

    BEGIN TRY
        BEGIN TRAN;

        -- 1. Check quyền
        EXEC sp_CheckStaffPermission @StaffAccountID;

        -- 2. Tạo Account
        EXEC sp_GenerateGuestAccount
            @Username OUTPUT,
            @Password OUTPUT,
            @AccountID OUTPUT;

        -- 3. Tạo Group
        EXEC sp_CreateGuestGroup
            @AccountID,
            @GroupID OUTPUT;

        -- 4. Thêm danh sách khách
        EXEC sp_AddGuestListToGroup
            @GroupID,
            @GuestList;

        COMMIT TRAN;

        -- 5. Trả kết quả
        SELECT
            @Username AS Username,
            @Password AS Password,
            @GroupID AS GroupID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRAN;
        THROW;
    END CATCH
END
GO
