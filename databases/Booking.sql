USE HolybirdResort
GO

CREATE OR ALTER PROCEDURE sp_GetMyTransaction
    @AccountID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        bt.TransactionID,
        bt.StartDate,
        bt.EndDate,
        bt.TotalPrice,
        bt.Status
    FROM BookingTransaction bt
    JOIN GuestGroup gg ON bt.GroupID = gg.GroupID
    JOIN Account a ON gg.AccountID = a.AccountID
    WHERE a.AccountID = @AccountID;
END
GO

-- ERR04:  UNREPEATEBLE READ
-- T1(Admin): Cập nhật giá phòng
-- T2(Khách hàng): đang tra cứu giá và thanh toán phòng

-- Lỗi (Unrepeatable Read): Guest thấy giá cũ, Admin đổi giá mới, Guest vẫn thanh toán được giá cũ (gây thất thoát cho khách sạn).
-- -> xử lí: (Nâng mức cô lập lên REPEATABLE READ): Guest đang xem/thanh toán thì Admin không thể đổi giá (bị chặn/loading).

---------------------------------------------------------------------
-- demo lỗi unreadable read
USE HolybirdResort
GO

-- 1. Xóa Procedure cũ
IF OBJECT_ID('dbo.sp_Guest_BookRoom_Transaction', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Guest_BookRoom_Transaction;
GO

-- 2. Tạo Procedure Mới 
CREATE PROCEDURE dbo.sp_Guest_BookRoom_Transaction
    @GroupID INT,
    @RankID INT,
    @TypeID INT,
    @CheckInDate DATETIME,  
    @CheckOutDate DATETIME, 
    @ClientPrice MONEY,     
    @PeopleCount INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED; 

    BEGIN TRY
        BEGIN TRAN;

        -- B1: KIỂM TRA GIÁ & KHÓA DỮ LIỆU
        DECLARE @CurrentPrice MONEY;
        
        SELECT @CurrentPrice = Price 
        FROM PriceRoom 
        WHERE RankID = @RankID AND TypeID = @TypeID;

        IF @CurrentPrice IS NULL
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW 50001, N'Loại phòng không tồn tại hoặc chưa có giá.', 1;
        END
        --  GIẢ LẬP ĐỘ TRỄ
        -- Trong 10 giây này, Admin sẽ bị treo nếu cố sửa giá
        
        WAITFOR DELAY '00:00:10';

        -- khớp với giá hiện tại trong DB.
        IF @CurrentPrice <> @ClientPrice
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW 50002, 'loi' , 1;
        END

        -- B2: TÌM PHÒNG TRỐNG (Thêm locking để tránh trùng phòng)
        DECLARE @RoomID INT;
        
        -- Ưu tiên phòng Free
        -- Dùng thêm UPDLOCK để chắc chắn người khác không select trúng nó nữa
        SELECT TOP 1 @RoomID = r.RoomID
        FROM Room r WITH (UPDLOCK) 
        WHERE r.RankID = @RankID 
          AND r.TypeID = @TypeID
          AND r.StatusPhysic = 'Free';

        -- Nếu không có phòng Free, check lịch (Logic cũ giữ nguyên)
        IF @RoomID IS NULL
        BEGIN
             SELECT TOP 1 @RoomID = r.RoomID
             FROM Room r WITH (UPDLOCK)
             WHERE r.RankID = @RankID AND r.TypeID = @TypeID
             AND NOT EXISTS (
                  SELECT 1 FROM BookingDetail bd 
                  WHERE bd.RoomID = r.RoomID 
                  AND bd.Status IN ('Booked', 'CheckedIn')
                  AND (bd.CheckInDate < @CheckOutDate AND bd.CheckOutDate > @CheckInDate)
             );
        END

        IF @RoomID IS NULL
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW 50003, N'Rất tiếc, đã hết phòng trống cho loại này.', 1;
        END

        -- B3: TẠO TRANSACTION
        DECLARE @TransactionID INT;
        DECLARE @StaffID INT;
        SELECT TOP 1 @StaffID = StaffID FROM Staff;
        IF @StaffID IS NULL SET @StaffID = 1; 

        INSERT INTO BookingTransaction (GroupID, StaffID, StartDate, EndDate, TotalPrice, Status)
        VALUES (@GroupID, @StaffID, @CheckInDate, @CheckOutDate, 0, 'Confirmed');
        
        SET @TransactionID = SCOPE_IDENTITY();

        -- B4: TẠO DETAIL
        DECLARE @LineTotal MONEY;
        DECLARE @Nights INT = DATEDIFF(DAY, @CheckInDate, @CheckOutDate);
        IF @Nights < 1 SET @Nights = 1;
        SET @LineTotal = @CurrentPrice * @Nights;

        INSERT INTO BookingDetail (TransactionID, RoomID, CheckInDate, CheckOutDate, CurrentPrice, LineTotal, Status)
        VALUES (@TransactionID, @RoomID, @CheckInDate, @CheckOutDate, @CurrentPrice, @LineTotal, 'Booked');

        -- B5: CẬP NHẬT TỔNG TIỀN VÀ TRẠNG THÁI PHÒNG
        UPDATE BookingTransaction 
        SET TotalPrice = @LineTotal 
        WHERE TransactionID = @TransactionID;

        -- Update trạng thái phòng
        UPDATE Room SET StatusPhysic = 'Busy' WHERE RoomID = @RoomID;

        COMMIT;
        
        -- Trả kết quả
        SELECT @TransactionID as TransactionID, @RoomID as RoomID, @LineTotal as TotalAmount;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

PRINT '>>> Đã cập nhật SP: Ngăn chặn Unrepeatable Read bằng REPEATABLE READ!';









---------------------------------------------------------------------
-- demo sửa lỗi unreadable read

USE HolybirdResort
GO

-- 1. Xóa Procedure cũ
IF OBJECT_ID('dbo.sp_Guest_BookRoom_Transaction', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Guest_BookRoom_Transaction;
GO

-- 2. Tạo Procedure Mới (Đã Fix lỗi Unrepeatable Read)
CREATE PROCEDURE dbo.sp_Guest_BookRoom_Transaction
    @GroupID INT,
    @RankID INT,
    @TypeID INT,
    @CheckInDate DATETIME,  
    @CheckOutDate DATETIME, 
    @ClientPrice MONEY,     
    @PeopleCount INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Đổi từ READ COMMITTED sang REPEATABLE READ
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; 

    BEGIN TRY
        BEGIN TRAN;

        -- B1: KIỂM TRA GIÁ & KHÓA DỮ LIỆU
        DECLARE @CurrentPrice MONEY;

  
        
        -- Lúc này, SQL sẽ khóa dòng giá này lại. 
        -- Nếu Admin chạy lệnh UPDATE giá ngay lúc này, Admin sẽ bị treo (Loading...) 
        -- cho đến khi giao dịch của khách hàng kết thúc.
        SELECT @CurrentPrice = Price 
        FROM PriceRoom 
        WHERE RankID = @RankID AND TypeID = @TypeID;

        IF @CurrentPrice IS NULL
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW 50001, N'Loại phòng không tồn tại hoặc chưa có giá.', 1;
        END
        --  GIẢ LẬP ĐỘ TRỄ 
        
        WAITFOR DELAY '00:00:10';

        --kiểm tra  để đảm bảo giá khách thấy trên Web (cách đây vài phút) 
        -- khớp với giá hiện tại trong DB.
        IF @CurrentPrice <> @ClientPrice
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            DECLARE @Msg NVARCHAR(200) = N'Giá phòng đã thay đổi từ ' + 
                                         FORMAT(@ClientPrice, 'N0') + N' thành ' + 
                                         FORMAT(@CurrentPrice, 'N0') + N'. Vui lòng tải lại.';
            THROW 50002, @Msg, 1;
        END

        -- B2: TÌM PHÒNG TRỐNG (Thêm locking để tránh trùng phòng)
        DECLARE @RoomID INT;
        
        -- Ưu tiên phòng Free
        -- Dùng thêm UPDLOCK để chắc chắn mình dat phong nay, người khác không select trúng nó nữa
        SELECT TOP 1 @RoomID = r.RoomID
        FROM Room r WITH (UPDLOCK) 
        WHERE r.RankID = @RankID 
          AND r.TypeID = @TypeID
          AND r.StatusPhysic = 'Free';

        -- Nếu không có phòng Free, check lịch 
        IF @RoomID IS NULL
        BEGIN
             SELECT TOP 1 @RoomID = r.RoomID
             FROM Room r WITH (UPDLOCK)
             WHERE r.RankID = @RankID AND r.TypeID = @TypeID
             AND NOT EXISTS (
                  SELECT 1 FROM BookingDetail bd 
                  WHERE bd.RoomID = r.RoomID 
                  AND bd.Status IN ('Booked', 'CheckedIn')
                  AND (bd.CheckInDate < @CheckOutDate AND bd.CheckOutDate > @CheckInDate)
             );
        END

        IF @RoomID IS NULL
        BEGIN
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW 50003, N'Rất tiếc, đã hết phòng trống cho loại này.', 1;
        END

        -- B3: TẠO TRANSACTION
        DECLARE @TransactionID INT;
        DECLARE @StaffID INT;
        SELECT TOP 1 @StaffID = StaffID FROM Staff;
        IF @StaffID IS NULL SET @StaffID = 1; 

        INSERT INTO BookingTransaction (GroupID, StaffID, StartDate, EndDate, TotalPrice, Status)
        VALUES (@GroupID, @StaffID, @CheckInDate, @CheckOutDate, 0, 'Confirmed');
        
        SET @TransactionID = SCOPE_IDENTITY();

        -- B4: TẠO DETAIL
        DECLARE @LineTotal MONEY;
        DECLARE @Nights INT = DATEDIFF(DAY, @CheckInDate, @CheckOutDate);
        IF @Nights < 1 SET @Nights = 1;
        SET @LineTotal = @CurrentPrice * @Nights;

        INSERT INTO BookingDetail (TransactionID, RoomID, CheckInDate, CheckOutDate, CurrentPrice, LineTotal, Status)
        VALUES (@TransactionID, @RoomID, @CheckInDate, @CheckOutDate, @CurrentPrice, @LineTotal, 'Booked');

        -- B5: CẬP NHẬT TỔNG TIỀN VÀ TRẠNG THÁI PHÒNG
        UPDATE BookingTransaction 
        SET TotalPrice = @LineTotal 
        WHERE TransactionID = @TransactionID;

        -- Update trạng thái phòng
        UPDATE Room SET StatusPhysic = 'Busy' WHERE RoomID = @RoomID;

        COMMIT;
        
        -- Trả kết quả
        SELECT @TransactionID as TransactionID, @RoomID as RoomID, @LineTotal as TotalAmount;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

PRINT '>>> Đã cập nhật SP: Ngăn chặn Unrepeatable Read bằng REPEATABLE READ!';





