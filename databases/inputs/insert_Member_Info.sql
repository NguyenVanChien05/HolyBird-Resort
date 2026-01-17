USE Holybird_Resort_db;
GO


/* REMOVED BY SCRIPT */

/* 
BULK INSERT Account_Staging
FROM 'c:\Users\NITRO\Documents\HQTCSDL\HolyBird-Resort\databases\data\Account.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2
)
 DELETED_BULK_INSERT */;

/* REMOVED BY SCRIPT */



/* REMOVED BY SCRIPT */

WITH StaffAccounts AS (
    SELECT AccountID, ROW_NUMBER() OVER (ORDER BY AccountID) AS rn
    FROM Account
    WHERE Role = 'Staff'
),
StaffList AS (
    SELECT StaffName, ROW_NUMBER() OVER (ORDER BY NEWID()) AS rn
    FROM Staff_Staging
)
INSERT INTO Staff (StaffName, AccountID)
SELECT s.StaffName, a.AccountID
FROM StaffList s
JOIN StaffAccounts a
    ON s.rn = a.rn;


/* REMOVED BY SCRIPT */

INSERT INTO Guest (FullName, CMND)
SELECT 
    FullName,
    CMND
FROM Guest_Staging
ORDER BY NEWID();
GO

/* REMOVED BY SCRIPT */
/* REMOVED BY SCRIPT */
/* REMOVED BY SCRIPT */



DECLARE @GroupID INT;
DECLARE @GroupSize INT;

/* Populate GuestGroup from Guest Accounts */
INSERT INTO GuestGroup (AccountID)
SELECT AccountID
FROM Account
WHERE Role = 'Guest';

DECLARE group_cursor CURSOR FOR
SELECT GroupID
FROM GuestGroup
ORDER BY GroupID;

OPEN group_cursor;
FETCH NEXT FROM group_cursor INTO @GroupID;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Random size 1�10
    SET @GroupSize = FLOOR(RAND(CHECKSUM(NEWID())) * 10) + 1;

    ;WITH NextGuests AS (
        SELECT TOP (@GroupSize)
            g.GuestID,
            ROW_NUMBER() OVER (ORDER BY g.GuestID) AS rn
        FROM Guest g
        WHERE NOT EXISTS (
            SELECT 1
            FROM GuestGroup_Detail d
            WHERE d.GuestID = g.GuestID
        )
        ORDER BY g.GuestID
    )
    INSERT INTO GuestGroup_Detail (GroupID, GuestID, IsLeader)
    SELECT
        @GroupID,
        GuestID,
        CASE WHEN rn = 1 THEN 1 ELSE 0 END
    FROM NextGuests;

    FETCH NEXT FROM group_cursor INTO @GroupID;
END

CLOSE group_cursor;
DEALLOCATE group_cursor;


