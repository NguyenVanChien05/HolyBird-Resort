USE Holybird_Resort_db
GO

INSERT INTO RankRoom (RankName) VALUES (N'Thường'), (N'Trung Bình'), (N'Sang'), (N'Rất Sang'), (N'VIP');

INSERT INTO RoomType (TypeName, Capacity) VALUES (N'1 Giường Đơn', 1), (N'1 Giường Đôi', 2), (N'2 Giường Đơn', 2), (N'2 Giường Đôi', 4);

INSERT INTO PriceRoom (RankID, TypeID, Price) 
SELECT r.RankID, t.TypeID, p.Price 
FROM RankRoom r 
JOIN RoomType t ON 1 = 1 
JOIN (VALUES 
	(N'Thường',     N'1 Giường Đơn',  300000), 
	(N'Thường',     N'1 Giường Đôi',  400000), 
	(N'Thường',     N'2 Giường Đơn',  500000), 
	(N'Thường',     N'2 Giường Đôi',  600000), 
	(N'Trung Bình', N'1 Giường Đơn',  500000), 
	(N'Trung Bình', N'1 Giường Đôi',  650000), 
	(N'Trung Bình', N'2 Giường Đơn',  750000), 
	(N'Trung Bình', N'2 Giường Đôi',  900000), 
	(N'Sang',       N'1 Giường Đơn',  800000), 
	(N'Sang',       N'1 Giường Đôi', 1000000), 
	(N'Sang',       N'2 Giường Đơn', 1200000), 
	(N'Sang',       N'2 Giường Đôi', 1500000), 
	(N'Rất Sang',   N'1 Giường Đơn', 1200000), 
	(N'Rất Sang',   N'1 Giường Đôi', 1500000), 
	(N'Rất Sang',   N'2 Giường Đơn', 1800000), 
	(N'Rất Sang',   N'2 Giường Đôi', 2200000), 
	(N'VIP',        N'1 Giường Đơn', 2000000), 
	(N'VIP',        N'1 Giường Đôi', 2500000), 
	(N'VIP',        N'2 Giường Đơn', 3000000), 
	(N'VIP',        N'2 Giường Đôi', 4000000) 
	) 
	p(RankName, TypeName, Price) 
	ON r.RankName = p.RankName 
	AND t.TypeName = p.TypeName;





DECLARE @Floor INT = 1;
DECLARE @RoomCount INT;
DECLARE @RoomNumber INT;
DECLARE @RankID INT;
DECLARE @TypeID INT;

WHILE @Floor <= 13
BEGIN
    -- Random s? phòng m?i t?ng: 15–20
    SET @RoomCount = FLOOR(RAND(CHECKSUM(NEWID())) * 6) + 15;

    SET @RoomNumber = 1;

    WHILE @RoomNumber <= @RoomCount
    BEGIN
        -- Random Rank & Type
        SELECT TOP 1 @RankID = RankID
        FROM RankRoom
        ORDER BY NEWID();

        SELECT TOP 1 @TypeID = TypeID
        FROM RoomType
        ORDER BY NEWID();

        INSERT INTO Room (
            RoomNumber,
            FloorNumber,
            StatusPhysic,
            RankID,
            TypeID
        )
        VALUES (
            @RoomNumber,
            @Floor,
            'Free',
            @RankID,
            @TypeID
        );

        SET @RoomNumber += 1;
    END

    SET @Floor += 1;
END;

SELECT FloorNumber,
       COUNT(*) AS SoPhong,
       MIN(RoomNumber) AS MinRoom,
       MAX(RoomNumber) AS MaxRoom
FROM Room
GROUP BY FloorNumber
ORDER BY FloorNumber;
