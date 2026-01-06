USE HolybirdResort
GO


drop PROCEDURE GetGuestsByGroup
CREATE PROCEDURE GetGuestsByGroup
    @GroupID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
		s.StaffID,
		s.StaffName,
        g.GuestID,
        g.FullName,
        g.CMND,
        gd.IsLeader
    FROM GuestGroup_Detail gd
    JOIN Guest g ON gd.GuestID = g.GuestID
	JOIN BookingTransaction bt ON bt.GroupID = @GroupID
	LEFT JOIN Staff s ON s.StaffID = bt.StaffID
    WHERE gd.GroupID = @GroupID
    ORDER BY gd.IsLeader DESC, g.FullName;
END

GO
CREATE PROCEDURE GetAllGroupsWithGuests
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        gg.GroupID,
        a.Username,
        g.GuestID,
        g.FullName,
        g.CMND,
        gd.IsLeader
    FROM GuestGroup gg
    LEFT JOIN GuestGroup_Detail gd ON gg.GroupID = gd.GroupID
    LEFT JOIN Guest g ON gd.GuestID = g.GuestID
	LEFT JOIN Account a ON gg.AccountID = a.AccountID
    ORDER BY gg.GroupID, gd.IsLeader DESC, g.FullName;
END
