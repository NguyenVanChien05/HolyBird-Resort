--lấy AccountID từ bảng Accounts dựa trên ID
create proc sp_getAccountID
    @id int
AS
BEGIN
    SELECT AccountID
    FROM Account
    WHERE AccountID = @id
END;

go

--Tạo tài khoản mới
create proc sp_createAccount
    @Username nvarchar(50),
    @Role VarChar(10),
    @Password VarChar(100)
AS
BEGIN
    INSERT INTO Account (Username,password, Role)
    VALUES (@Username, @Password, @Role)
END;

go
--Cập nhật thông tin tài khoản
create proc sp_updateAccount
    @AccountID int,
    @Username nvarchar(50),
    @Role VarChar(10)
AS
BEGIN
    UPDATE Account
    SET Username = @Username,
        Role = @Role
    WHERE AccountID = @AccountID
END;

go

--Xóa tài khoản
create proc sp_deleteAccount
    @AccountID int
AS
BEGIN
    DELETE FROM Account
    WHERE AccountID = @AccountID
END;

GO 

--Đặt phòng
create proc sp_bookRooms
    @RankID INT,
    @FloorNumber INT,
    @TypeID INT,
    @RoomCount INT,
    @GroupID INT,
    @StaffID INT,
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Price MONEY;
    DECLARE @TransactionID INT;
    DECLARE @AvailableCount INT;

    -- 1. Kiểm tra giá phòng
    SELECT @Price = Price 
    FROM PriceRoom 
    WHERE RankID = @RankID AND TypeID = @TypeID;

    IF @Price IS NULL
    BEGIN
        ;THROW 50001, N'Lỗi: Chưa thiết lập giá cho hạng và loại phòng này.', 1;
        RETURN;
    END

    -- 2. Kiểm tra số lượng phòng trống
    SELECT @AvailableCount = COUNT(*)
    FROM Room
    WHERE RankID = @RankID 
      AND TypeID = @TypeID 
      AND FloorNumber = @FloorNumber 
      AND StatusPhysic = 'Free';

    IF @AvailableCount = 0
    BEGIN
        DECLARE @MsgEmpty NVARCHAR(200) = FORMATMESSAGE(N'Tầng %d hiện tại không còn phòng trống nào thuộc hạng và loại yêu cầu.', @FloorNumber);
        ;THROW 50002, @MsgEmpty, 1;
        RETURN;
    END

    IF @AvailableCount < @RoomCount
    BEGIN
        DECLARE @MsgNotEnough NVARCHAR(200) = FORMATMESSAGE(N'Không đủ phòng! Tầng %d chỉ còn %d phòng trống, trong khi bạn yêu cầu %d phòng.', @FloorNumber, @AvailableCount, @RoomCount);
        ;THROW 50003, @MsgNotEnough, 1;
        RETURN;
    END

    -- 3. Thực hiện đặt phòng
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Tạo Transaction cha
        INSERT INTO BookingTransaction (GroupID, StaffID, StartDate, EndDate, TotalPrice, Status)
        VALUES (@GroupID, @StaffID, @StartDate, @EndDate, 0, 'Confirmed');

        SET @TransactionID = SCOPE_IDENTITY();

        -- Thêm vào BookingDetail
        INSERT INTO BookingDetail (TransactionID, RoomID, GuestID, CheckInDate, CheckOutDate, CurrentPrice, LineTotal, Status)
        SELECT TOP (@RoomCount)
               @TransactionID, 
               RoomID, 
               (SELECT TOP 1 GuestID FROM GuestGroup_Detail WHERE GroupID = @GroupID),
               @StartDate, 
               @EndDate, 
               @Price, 
               @Price * DATEDIFF(DAY, @StartDate, @EndDate), 
               'Booked'
        FROM Room
        WHERE RankID = @RankID 
          AND TypeID = @TypeID 
          AND FloorNumber = @FloorNumber 
          AND StatusPhysic = 'Free';

        -- Cập nhật trạng thái phòng
        UPDATE Room
        SET StatusPhysic = 'Busy'
        WHERE RoomID IN (SELECT RoomID FROM BookingDetail WHERE TransactionID = @TransactionID);

        -- Cập nhật tổng tiền
        UPDATE BookingTransaction
        SET TotalPrice = (SELECT SUM(LineTotal) FROM BookingDetail WHERE TransactionID = @TransactionID)
        WHERE TransactionID = @TransactionID;

        COMMIT TRANSACTION;
        
        -- Trả về kết quả thành công cho Node.js
        SELECT 'Success' AS Status, N'Đặt phòng thành công!' AS Message, @TransactionID AS TransactionID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        -- Ném lại lỗi hệ thống để Node.js bắt được
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        ;THROW 50000, @ErrorMessage, 1;
    END CATCH
END