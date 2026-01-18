USE Holybird_Resort_db;
GO

CREATE OR ALTER PROCEDURE sp_Demo_DirtyUpdate
    @TransactionID INT
AS
BEGIN
    BEGIN TRANSACTION;
        -- Giả sử nhập nhầm thành 100 triệu
        UPDATE BookingTransaction
        SET TotalPrice = 100000000 
        WHERE TransactionID = @TransactionID;
        
        -- Đợi 15 giây để bạn kịp sang tab Admin nhấn Refresh
        WAITFOR DELAY '00:00:15';
        
    ROLLBACK TRANSACTION; -- Sau 15s tự động trả về giá cũ
END;
GO 

CREATE OR ALTER PROCEDURE sp_GetAllTransactions
AS
BEGIN
    SET NOCOUNT ON;
    -- Cho phép đọc dữ liệu chưa commit
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; 

    SELECT bt.TransactionID, bt.GroupID, bt.StartDate, bt.EndDate, bt.TotalPrice, bt.Status, s.StaffName
    FROM BookingTransaction bt
    JOIN Staff s ON bt.StaffID = s.StaffID
    ORDER BY bt.TransactionID DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetAllTransactions_Clean
AS
BEGIN
    SET NOCOUNT ON;
    -- CHỐT: Chỉ đọc dữ liệu đã được Commit chính thức
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED; 

    SELECT bt.TransactionID, bt.GroupID, bt.StartDate, bt.EndDate, bt.TotalPrice, bt.Status, s.StaffName
    FROM BookingTransaction bt
    JOIN Staff s ON bt.StaffID = s.StaffID
    ORDER BY bt.TransactionID DESC;
END;
GO