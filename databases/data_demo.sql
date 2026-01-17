-- Staff accounts


DELETE FROM GuestGroup_Detail;
DELETE FROM GuestGroup;
DELETE FROM Guest;
DELETE FROM Staff;
DELETE FROM Account;

DBCC CHECKIDENT ('Account', RESEED, 0);
DBCC CHECKIDENT ('Staff', RESEED, 0);
DBCC CHECKIDENT ('Guest', RESEED, 0);
DBCC CHECKIDENT ('GuestGroup', RESEED, 0);
SELECT IDENT_CURRENT('Guest') AS GuestID_Current;
SELECT IDENT_CURRENT('GuestGroup') AS GroupID_Current;


INSERT INTO Account (Username, Password, Role) VALUES
('admin01', 'admin123', 'Admin'),
('staff01', 'staff123', 'Staff'),
('staff02', 'staff456', 'Staff');

-- Guest accounts
INSERT INTO Account (Username, Password, Role) VALUES
('guest01', 'guest123', 'Guest'),
('guest02', 'guest123', 'Guest'),
('guest03', 'guest123', 'Guest'),
('guest04', 'guest123', 'Guest'),
('guest05', 'guest123', 'Guest');
select* from Account
INSERT INTO Staff (StaffName, AccountID) VALUES
(N'Trần Thị Mai', 2),
(N'Lê Quốc Bảo', 3);

INSERT INTO Guest (FullName, CMND) VALUES
(N'Nguyễn Văn An', '079201001234'),
(N'Trần Thị Bích', '079201001235'),
(N'Lê Minh Châu', '079201001236'),
(N'Phạm Quốc Dũng', '079201001237'),
(N'Hoàng Thị Hạnh', '079201001238'),

(N'Võ Thanh Long', '079201001239'),
(N'Đặng Ngọc Mai', '079201001240'),
(N'Bùi Quang Nam', '079201001241'),
(N'Nguyễn Thị Oanh', '079201001242'),

(N'Trương Văn Phúc', '079201001243'),
(N'Phan Thị Quỳnh', '079201001244'),
(N'Ngô Minh Tân', '079201001245'),
(N'Lý Thị Uyên', '079201001246'),

(N'Đỗ Văn Vinh', '079201001247'),
(N'Nguyễn Khánh Vy', '079201001248'),
(N'Trần Minh Xuyên', '079201001249'),

(N'Huỳnh Quốc Yên', '079201001250'),
(N'Phạm Thị Ánh', '079201001251'),
(N'Lê Hoàng Bình', '079201001252'),
(N'Nguyễn Thị Cẩm', '079201001253');


INSERT INTO GuestGroup (AccountID) VALUES
(4), -- group 1
(5), -- group 2
(6), -- group 3
(7), -- group 4
(8); -- group 5
select* from GuestGroup_Detail

INSERT INTO GuestGroup_Detail VALUES
(1, 1, 'Yes'),
(1, 2, 'No'),
(1, 3, 'No'),
(1, 4, 'No');

INSERT INTO GuestGroup_Detail VALUES
(2, 5, 'Yes'),
(2, 6, 'No'),
(2, 7, 'No');

INSERT INTO GuestGroup_Detail VALUES
(3, 8, 'Yes'),
(3, 9, 'No'),
(3, 10, 'No'),
(3, 11, 'No'),
(3, 12, 'No'),
(3, 13, 'No'),
(3, 14, 'No'),
(3, 15, 'No');

INSERT INTO GuestGroup_Detail VALUES
(4, 16, 'Yes');

INSERT INTO GuestGroup_Detail VALUES
(5, 17, 'Yes'),
(5, 18, 'No'),
(5, 19, 'No'),
(5, 20, 'No');

INSERT INTO BookingTransaction
(
    GroupID,
    StaffID,
    StartDate,
    EndDate,
    TotalPrice,
    Status
)
SELECT
    gg.GroupID,
    2,                          -- StaffID demo
    '2026-02-01',
    '2026-02-03',
    0,
    'Booked'
FROM GuestGroup gg;

INSERT INTO BookingDetail
(
    TransactionID,
    RoomID,
    GuestID,
    CheckInDate,
    CheckOutDate,
    CurrentPrice,
    LineTotal,
    Compensation,
    Status
)
SELECT
    bt.TransactionID,
    r.RoomID,
    ggd.GuestID,
    bt.StartDate,
    bt.EndDate,
    pr.Price,
    pr.Price * DATEDIFF(DAY, bt.StartDate, bt.EndDate),
    0,
    'Booked'
FROM GuestGroup_Detail ggd
JOIN BookingTransaction bt ON bt.GroupID = ggd.GroupID
CROSS APPLY (
    SELECT TOP 1 RoomID
    FROM Room
    WHERE StatusPhysic = 'Free'
    ORDER BY RoomID
) r
JOIN PriceRoom pr ON pr.RankID = 1 AND pr.TypeID = 1;

UPDATE bt
SET TotalPrice = x.Total
FROM BookingTransaction bt
JOIN (
    SELECT TransactionID, SUM(LineTotal) AS Total
    FROM BookingDetail
    GROUP BY TransactionID
) x ON bt.TransactionID = x.TransactionID;



