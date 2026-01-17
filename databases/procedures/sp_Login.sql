USE Holybird_Resort_db
GO
select* from Account a
join Staff s on a.AccountID = s.AccountID
where Username = 'Staff001'

CREATE OR ALTER PROCEDURE sp_Login
    @Username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.AccountID,
        a.Username,
        a.Password,      -- hash
        a.Role,

        -- Guest
        g.GroupID,

        -- Staff
        s.StaffID

    FROM Account a
    LEFT JOIN GuestGroup g ON a.AccountID = g.AccountID
    LEFT JOIN Staff s ON a.AccountID = s.AccountID
    WHERE a.Username = @Username;
END
GO
