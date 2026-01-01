CREATE PROCEDURE sp_Login
    @Username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.AccountID,
        a.Username,
        a.Password,
        a.Role,
        g.GroupID
    FROM Account a
    LEFT JOIN GuestGroup g ON a.AccountID = g.AccountID
    WHERE a.Username = @Username;
END
