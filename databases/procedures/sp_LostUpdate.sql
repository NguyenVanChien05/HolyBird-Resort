USE Holybird_Resort_db
GO

/* =============================================
   SCENARIO 1: BUG (LOST UPDATE)
   ============================================= */

-- T1: Admin hủy giao dịch (Chậm)
CREATE OR ALTER PROCEDURE sp_HuyGiaoDich
    @MaGiaoDich INT
AS
BEGIN
    -- 1. Đọc trạng thái
    DECLARE @Status VARCHAR(20)
    SELECT @Status = Status FROM BookingTransaction WHERE TransactionID = @MaGiaoDich

    IF @Status <> 'Pending'
    BEGIN
        RAISERROR ('Giao dịch không ở trạng thái Pending', 16, 1)
        RETURN
    END

    -- 2. Giả lập xử lý chậm (10s)
    WAITFOR DELAY '00:00:10'

    -- 3. Cập nhật thành Cancelled
    UPDATE BookingTransaction
    SET Status = 'Cancelled'
    WHERE TransactionID = @MaGiaoDich

    SELECT * FROM BookingTransaction WHERE TransactionID = @MaGiaoDich
END
GO

-- T2: Lễ tân xác nhận giao dịch (Nhanh)
CREATE OR ALTER PROCEDURE sp_CapTaiKhoan
    @MaGiaoDich INT
AS
BEGIN
    -- 1. Đọc trạng thái
    DECLARE @Status VARCHAR(20)
    SELECT @Status = Status FROM BookingTransaction WHERE TransactionID = @MaGiaoDich

    IF @Status <> 'Pending'
    BEGIN
        RAISERROR ('Giao dịch không ở trạng thái Pending', 16, 1)
        RETURN
    END

    -- 2. Cập nhật ngay lập tức
    UPDATE BookingTransaction
    SET Status = 'Completed' -- Confirmed/Completed
    WHERE TransactionID = @MaGiaoDich

    SELECT * FROM BookingTransaction WHERE TransactionID = @MaGiaoDich
END
GO


/* =============================================
   SCENARIO 1: FIX (LOCKING)
   ============================================= */

-- T1 Fix: Sử dụng UPDLOCK để giữ khóa khi đọc
CREATE OR ALTER PROCEDURE sp_HuyGiaoDich_Fix
    @MaGiaoDich INT
AS
BEGIN
    BEGIN TRANSACTION

    -- 1. Đọc với UPDLOCK (Chặn người khác đọc để sửa)
    DECLARE @Status VARCHAR(20)
    SELECT @Status = Status 
    FROM BookingTransaction WITH (UPDLOCK) 
    WHERE TransactionID = @MaGiaoDich

    IF @Status <> 'Pending'
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR ('Giao dịch không khả dụng để hủy', 16, 1)
        RETURN
    END

    -- 2. Delay vẫn giữ khóa
    WAITFOR DELAY '00:00:10'

    -- 3. Cập nhật
    UPDATE BookingTransaction
    SET Status = 'Cancelled'
    WHERE TransactionID = @MaGiaoDich

    COMMIT TRANSACTION

    SELECT * FROM BookingTransaction WHERE TransactionID = @MaGiaoDich
END
GO

-- T2 Fix: Cũng phải dùng UPDLOCK hoặc cơ chế tương tự
CREATE OR ALTER PROCEDURE sp_CapTaiKhoan_Fix
    @MaGiaoDich INT
AS
BEGIN
    BEGIN TRANSACTION

    -- 1. Cố gắng đọc (Sẽ bị chặn nếu T1 đang giữ UPDLOCK)
    DECLARE @Status VARCHAR(20)
    SELECT @Status = Status 
    FROM BookingTransaction WITH (UPDLOCK) 
    WHERE TransactionID = @MaGiaoDich

    IF @Status <> 'Pending'
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR ('Thất bại: Đơn đã bị hủy hoặc không tồn tại', 16, 1)
        RETURN
    END

    -- 2. Cập nhật
    UPDATE BookingTransaction
    SET Status = 'Completed'
    WHERE TransactionID = @MaGiaoDich

    COMMIT TRANSACTION

    SELECT * FROM BookingTransaction WHERE TransactionID = @MaGiaoDich
END
GO
