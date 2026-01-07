USE Holybird_Resort_db;
GO


CREATE TABLE Account_Staging (
    Username VARCHAR(50),
    Password VARCHAR(100),
    Role VARCHAR(10)
);

BULK INSERT Account_Staging
FROM 'D:\Holybird_Resort_Project\HolyBird-Resort\databases\data\Account.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2
);

INSERT INTO Account (Username, Password, Role)
SELECT Username, Password, Role
FROM Account_Staging;



CREATE TABLE Staff_Staging (
	firstname NVARCHAR(50),
	middlename NVARCHAR(50),
	lastname NVARCHAR(50),
    StaffName NVARCHAR(100)
);

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


CREATE TABLE Guest_Staging (
	first_name NVARCHAR(50),
	middle_name NVARCHAR(50),
	last_name NVARCHAR(50),
    FullName NVARCHAR(100),
    CMND VARCHAR(9)
);

INSERT INTO Guest (FullName, CMND)
SELECT 
    FullName,
    CMND
FROM Guest_Staging
ORDER BY NEWID();
GO

DROP TABLE Account_Staging;
DROP TABLE Staff_Staging;
DROP TABLE Guest_Staging;



DECLARE @GroupID INT;
DECLARE @GroupSize INT;

DECLARE group_cursor CURSOR FOR
SELECT GroupID
FROM GuestGroup
ORDER BY GroupID;

OPEN group_cursor;
FETCH NEXT FROM group_cursor INTO @GroupID;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Random size 1–10
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
        CASE WHEN rn = 1 THEN 'Yes' ELSE 'No' END
    FROM NextGuests;

    FETCH NEXT FROM group_cursor INTO @GroupID;
END

CLOSE group_cursor;
DEALLOCATE group_cursor;


