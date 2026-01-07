
CREATE DATABASE Holybird_Resort_db;
GO

USE Holybird_Resort_db;
GO

CREATE TABLE Account (
    AccountID INT IDENTITY PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE CHECK (LEN(Username) >= 4),
    Password VARCHAR(100) NOT NULL CHECK (LEN(Password) >= 6),
    Role VARCHAR(10) NOT NULL CHECK (Role IN ('Admin','Staff','Guest'))
);

CREATE TABLE Staff (
    StaffID INT IDENTITY PRIMARY KEY,
    StaffName NVARCHAR(100) NOT NULL CHECK (LEN(StaffName) >= 3),
    AccountID INT NOT NULL,
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
);

CREATE TABLE Guest (
    GuestID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    CMND VARCHAR(12) CHECK (CMND IS NULL OR LEN(CMND) IN (9,12))
);

CREATE TABLE GuestGroup (
    GroupID INT IDENTITY PRIMARY KEY,
    AccountID INT NOT NULL,
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
);

CREATE TABLE GuestGroup_Detail (
    GroupID INT,
    GuestID INT,
    IsLeader BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (GroupID, GuestID),
    FOREIGN KEY (GroupID) REFERENCES GuestGroup(GroupID) ON DELETE CASCADE,
    FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
);

CREATE TABLE RankRoom (
    RankID INT IDENTITY PRIMARY KEY,
    RankName NVARCHAR(50) NOT NULL UNIQUE CHECK (LEN(RankName) >= 3)
);

CREATE TABLE RoomType (
    TypeID INT IDENTITY PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL UNIQUE CHECK (LEN(TypeName) >= 3),
    Capacity INT NOT NULL CHECK (Capacity > 0)
);

CREATE TABLE PriceRoom (
    RankID INT,
    TypeID INT,
    Price MONEY NOT NULL CHECK (Price > 0),
    PRIMARY KEY (RankID, TypeID),
    FOREIGN KEY (RankID) REFERENCES RankRoom(RankID),
    FOREIGN KEY (TypeID) REFERENCES RoomType(TypeID)
);

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
);

CREATE TABLE BookingTransaction (
    TransactionID INT IDENTITY PRIMARY KEY,
    GroupID INT NOT NULL,
    StaffID INT NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    TotalPrice MONEY NOT NULL DEFAULT 0 CHECK (TotalPrice >= 0),
    Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (GroupID) REFERENCES GuestGroup(GroupID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID),
	CONSTRAINT CHK_BookingTransaction_Dates CHECK (StartDate < EndDate)
);


CREATE TABLE BookingDetail (
    DetailID INT IDENTITY PRIMARY KEY,
    TransactionID INT NOT NULL,
    RoomID INT NOT NULL,
    GuestID INT NULL,
    CheckInDate DATETIME NOT NULL,
    CheckOutDate DATETIME NOT NULL,
    CurrentPrice MONEY NOT NULL CHECK (CurrentPrice > 0),
    LineTotal MONEY NOT NULL CHECK (LineTotal >= 0),
    Compensation MONEY DEFAULT 0,
    Status VARCHAR(20) NOT NULL CHECK (Status IN ('Booked','CheckedIn','CheckedOut','Cancelled')),
    FOREIGN KEY (TransactionID) REFERENCES BookingTransaction(TransactionID) ON DELETE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID),
    FOREIGN KEY (GuestID) REFERENCES Guest(GuestID),
    CONSTRAINT CHK_BookingDetail_Dates CHECK (CheckInDate < CheckOutDate)
);


CREATE INDEX IX_BookingDetail_Guest ON BookingDetail(GuestID);

CREATE TABLE KeyCard (
    CardID INT IDENTITY PRIMARY KEY,
    RoomID INT NULL,
    DetailID INT NULL,
    CardCode VARCHAR(50) UNIQUE NOT NULL,
    IssueDate DATETIME NOT NULL DEFAULT GETDATE(),
    ExpireDate DATETIME NULL,
    Status VARCHAR(20) NOT NULL CHECK (Status IN ('Active','Expired','Lost','Disabled')),
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID),
    FOREIGN KEY (DetailID) REFERENCES BookingDetail(DetailID) ON DELETE SET NULL
);

CREATE INDEX IX_KeyCard_RoomID ON KeyCard(RoomID);

CREATE TABLE BookingRequest (
    RequestID INT IDENTITY PRIMARY KEY,
    TransactionID INT NOT NULL,
    RankID INT NOT NULL,
    TypeID INT NOT NULL,
    FloorNumber INT NULL,
    RoomCount INT NOT NULL CHECK (RoomCount > 0),
    CheckInDate DATE NOT NULL,
    CheckOutDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (TransactionID) REFERENCES BookingTransaction(TransactionID),
    FOREIGN KEY (RankID) REFERENCES RankRoom(RankID),
    FOREIGN KEY (TypeID) REFERENCES RoomType(TypeID),
	CONSTRAINT CHK_BookingRequest_Dates CHECK (CheckInDate < CheckOutDate)
);

