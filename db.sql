

CREATE DATABASE HolybirdResort
GO

USE HolybirdResort
GO

CREATE TABLE Account (
	AccountID INT IDENTITY PRIMARY KEY,
	Username VARCHAR(50) NOT NULL UNIQUE CHECK (LEN(Username) >= 4),
	Password VARCHAR(100) NOT NULL CHECK (LEN(Password) >= 6),
	Role VARCHAR(10) NOT NULL CHECK (Role IN ('Admin','Staff','Guest'))
)

CREATE TABLE Staff (
	StaffID INT IDENTITY PRIMARY KEY,
	StaffName NVARCHAR(100) NOT NULL CHECK (LEN(StaffName) >= 3),
	AccountID INT NOT NULL,
	FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
)

CREATE TABLE Guest (
	GuestID INT IDENTITY PRIMARY KEY,
	FullName NVARCHAR(100) NOT NULL,
	CMND VARCHAR(12),
	CHECK (CMND IS NULL OR (LEN(CMND) IN (9,12)))
)

CREATE TABLE GuestGroup (
	GroupID INT IDENTITY PRIMARY KEY,
	AccountID INT NOT NULL,
	FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
)

CREATE TABLE GuestGroup_Detail (
	GroupID INT,
	GuestID INT,
	PRIMARY KEY (GroupID, GuestID),
	FOREIGN KEY (GroupID) REFERENCES GuestGroup(GroupID) ON DELETE CASCADE,
	FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
)

CREATE TABLE RankRoom (
	RankID INT IDENTITY PRIMARY KEY,
	RankName NVARCHAR(50) NOT NULL UNIQUE,
	CHECK (LEN(RankName) >= 3)
)

CREATE TABLE RoomType (
	TypeID INT IDENTITY PRIMARY KEY,
	TypeName NVARCHAR(50) NOT NULL UNIQUE,
	Capacity INT NOT NULL CHECK (Capacity > 0),
	CHECK (LEN(TypeName) >= 3)
)

CREATE TABLE PriceRoom (
	RankID INT,
	TypeID INT,
	Price MONEY NOT NULL CHECK (Price > 0),
	PRIMARY KEY (RankID, TypeID),
	FOREIGN KEY (RankID) REFERENCES RankRoom(RankID),
	FOREIGN KEY (TypeID) REFERENCES RoomType(TypeID)
)

CREATE TABLE Room (
	RoomID INT IDENTITY PRIMARY KEY,
	RoomNumber INT NOT NULL CHECK (RoomNumber > 0),
	FloorNumber INT NOT NULL CHECK (FloorNumber BETWEEN 1 AND 13),
	StatusPhysic VARCHAR(10) NOT NULL CHECK (StatusPhysic IN ('Free','Busy')),
	RankID INT NOT NULL,
	TypeID INT NOT NULL,
	UNIQUE (RoomNumber, FloorNumber),
	FOREIGN KEY (RankID) REFERENCES RankRoom(RankID),
	FOREIGN KEY (TypeID) REFERENCES RoomType(TypeID)
)

CREATE TABLE BookingTransaction (
	TransactionID INT IDENTITY PRIMARY KEY,
	GroupID INT NOT NULL,
	StaffID INT NOT NULL,
	StartDate DATETIME NOT NULL,
	EndDate DATETIME NOT NULL,
	TotalPrice MONEY NOT NULL DEFAULT 0 CHECK (TotalPrice >= 0),
	Status VARCHAR(20) NOT NULL,
	CHECK (StartDate < EndDate),
	FOREIGN KEY (GroupID) REFERENCES GuestGroup(GroupID),
	FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
)

CREATE TABLE BookingDetail (
	DetailID INT IDENTITY PRIMARY KEY,
	TransactionID INT NOT NULL,
	RoomID INT NOT NULL,
	GuestID INT NOT NULL,
	CheckInDate DATETIME NOT NULL,
	CheckOutDate DATETIME NOT NULL,
	CurrentPrice MONEY NOT NULL CHECK (CurrentPrice > 0),
	LineTotal MONEY NOT NULL CHECK (LineTotal >= 0),
	Status VARCHAR(20) NOT NULL CHECK (Status IN ('Booked','Available')),
	CHECK (CheckInDate < CheckOutDate),
	FOREIGN KEY (TransactionID) REFERENCES BookingTransaction(TransactionID) ON DELETE CASCADE,
	FOREIGN KEY (RoomID) REFERENCES Room(RoomID),
	FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
)

CREATE TABLE KeyCard (
	CardID INT IDENTITY PRIMARY KEY,
	DetailID INT NOT NULL,
	IsActive BIT NOT NULL CHECK (IsActive IN (0,1)),
	FOREIGN KEY (DetailID) REFERENCES BookingDetail(DetailID)
)

GO
CREATE TRIGGER trg_NoOverlappingRoom
ON BookingDetail
FOR INSERT
AS
BEGIN
	IF EXISTS (
		SELECT 1
		FROM BookingDetail b
		JOIN inserted i ON b.RoomID = i.RoomID
		WHERE NOT (
			i.CheckOutDate <= b.CheckInDate
			OR i.CheckInDate >= b.CheckOutDate
		)
		AND b.DetailID <> i.DetailID
	)
	BEGIN
		RAISERROR (N'Phòng đã được đặt trong khoảng thời gian này', 16, 1)
		ROLLBACK
	END
END
GO

CREATE TRIGGER trg_UpdateTotalPrice
ON BookingDetail
AFTER INSERT, DELETE
AS
BEGIN
	UPDATE BookingTransaction
	SET TotalPrice = (
		SELECT ISNULL(SUM(LineTotal),0)
		FROM BookingDetail
		WHERE TransactionID = BookingTransaction.TransactionID
	)
	WHERE TransactionID IN (
		SELECT TransactionID FROM inserted
		UNION
		SELECT TransactionID FROM deleted
	)
END
GO


INSERT INTO Account (Username, Password, Role) VALUES
('admin01', 'admin123', 'Admin'),
('staff01', 'staff123', 'Staff'),
('staff02', 'staff456', 'Staff'),
('guest01', 'guest123', 'Guest'),
('guest02', 'guest456', 'Guest');

INSERT INTO Staff (StaffName, AccountID) VALUES
(N'Nguyễn Văn An', 2),
(N'Trần Thị Bình', 3);

INSERT INTO Guest (FullName, CMND) VALUES
(N'Lê Hoàng Minh', '123456789'),
(N'Phạm Thu Hà', '123456789012'),
(N'Võ Quốc Bảo', NULL),
(N'Nguyễn Thị Lan', '987654321');

INSERT INTO GuestGroup (AccountID) VALUES
(4),
(5);

INSERT INTO GuestGroup_Detail (GroupID, GuestID) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4);

INSERT INTO RankRoom (RankName) VALUES
(N'Thường'),
(N'Trung bình'),
(N'Sang'),
(N'Rất sang'),
(N'VIP');

INSERT INTO RoomType (TypeName, Capacity) VALUES
(N'1 giường đơn', 1),
(N'1 giường đôi', 2),
(N'2 giường đơn', 2),
(N'2 giường đôi', 4);


DELETE FROM PriceRoom;

INSERT INTO PriceRoom (RankID, TypeID, Price) VALUES
-- Thường
(1,1,600000),(1,2,800000),(1,3,900000),(1,4,1200000),

-- Trung bình
(2,1,900000),(2,2,1200000),(2,3,1400000),(2,4,1800000),

-- Sang
(3,1,1300000),(3,2,1700000),(3,3,2000000),(3,4,2600000),

-- Rất sang
(4,1,1800000),(4,2,2300000),(4,3,2700000),(4,4,3500000),

-- VIP
(5,1,2500000),(5,2,3200000),(5,3,3800000),(5,4,5000000);


DECLARE @Floor INT = 1;
DECLARE @Room INT;
DECLARE @RankID INT;
DECLARE @TypeID INT;

WHILE @Floor <= 13
BEGIN
    SET @Room = 1;

    WHILE @Room <= 18   -- mỗi tầng 18 phòng (nằm trong 15–20)
    BEGIN
        SET @RankID = ((@Floor + @Room) % 5) + 1;
        SET @TypeID = ((@Room) % 4) + 1;

        INSERT INTO Room
        (RoomNumber, FloorNumber, StatusPhysic, RankID, TypeID)
        VALUES
        (@Room, @Floor,
         CASE WHEN @Room % 5 = 0 THEN 'Busy' ELSE 'Free' END,
         @RankID, @TypeID);

        SET @Room = @Room + 1;
    END

    SET @Floor = @Floor + 1;
END
GO

-- số phòng mỗi tầng
SELECT FloorNumber, COUNT(*) AS SoPhong
FROM Room
GROUP BY FloorNumber;

-- phân bố hạng
SELECT r.RankName, COUNT(*) 
FROM Room ro JOIN RankRoom r ON ro.RankID = r.RankID
GROUP BY r.RankName;

-- phân bố hình thức
SELECT t.TypeName, COUNT(*)
FROM Room ro JOIN RoomType t ON ro.TypeID = t.TypeID
GROUP BY t.TypeName;


-- trigger chống trùng phòng
SELECT * FROM BookingDetail;

