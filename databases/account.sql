use HolybirdResort
go

CREATE TYPE GuestListType AS TABLE (
    FullName NVARCHAR(100),
    CMND VARCHAR(12),
    IsLeader VARCHAR(3) -- 'Yes' hoặc 'No'
);
GO


CREATE PROCEDURE sp_CreateGuestAccount
    @Username VARCHAR(50),
    @Password VARCHAR(100),
    @AccountID INT OUTPUT
AS
BEGIN
    INSERT INTO Account (Username, Password, Role)
    VALUES (@Username, @Password, 'Guest');

    SET @AccountID = SCOPE_IDENTITY();
END;
GO


CREATE PROCEDURE sp_GetOrCreateGuest
    @FullName NVARCHAR(100),
    @CMND VARCHAR(12),
    @IsLeader VARCHAR(3),
    @GuestID INT OUTPUT
AS
BEGIN
    IF @CMND IS NOT NULL
    BEGIN
        SELECT @GuestID = GuestID FROM Guest WHERE CMND = @CMND;
    END

    IF @GuestID IS NULL
    BEGIN
        INSERT INTO Guest (FullName, CMND, IsLeader)
        VALUES (@FullName, @CMND, @IsLeader);

        SET @GuestID = SCOPE_IDENTITY();
    END
END
GO
