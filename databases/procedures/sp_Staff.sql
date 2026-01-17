USE Holybird_Resort_db
GO

CREATE OR ALTER PROCEDURE sp_GetAllStaff
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.StaffID, 
        s.StaffName, 
        a.Username, 
        a.Role
    FROM Staff s
    JOIN Account a ON s.AccountID = a.AccountID
END
GO
