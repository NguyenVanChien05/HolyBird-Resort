DROP PROCEDURE IF EXISTS sp_AddCompensation;
GO
Create PROCEDURE sp_AddCompensation
(
    @TransactionID INT,
    @Compensation_Amount MONEY,
    @Reason NVARCHAR(255) = NULL,
    @CreatedBy INT
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

		--SELECT 1
		--FROM BookingTransaction WITH (UPDLOCK)
		--WHERE TransactionID = @TransactionID;

        IF @Compensation_Amount <= 0
            THROW 50010, N'Số tiền bồi thường phải > 0', 1;

        IF NOT EXISTS (
            SELECT 1 FROM BookingTransaction WHERE TransactionID = @TransactionID
        )
            THROW 50011, N'Không tồn tại Transaction', 1;

        -- Validate staff
        IF NOT EXISTS (
            SELECT 1 FROM Staff WHERE StaffID = @CreatedBy
        )
            THROW 50012, N'Staff không tồn tại', 1;

        -- 1 Insert Compensation
        INSERT INTO Compensation
        (
            TransactionID,
            Compensation_Amount,
            Reason,
            CreatedBy
        )
        VALUES
        (
            @TransactionID,
            @Compensation_Amount,
            @Reason,
            @CreatedBy
        );
		
        WAITFOR DELAY '00:00:10';

        EXEC sp_UpdateTransactionTotalPrice @TransactionID;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO

select* from BookingDetail
select* from Account
select* from Compensation 
select* from Guest

select * from GuestGroup_Detail 
exec sp_GetCompensationsByTransaction 35
exec sp_UpdateTransactionTotalPrice 35
CREATE OR ALTER PROCEDURE sp_GetCompensationsByTransaction
    @TransactionID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CompensationID,
        c.Compensation_Amount,
        c.Reason,
        c.Status,
        c.CreatedAt,
        s.StaffName AS CreatedByName
    FROM Compensation c
    LEFT JOIN Staff s ON s.StaffID = c.CreatedBy
    WHERE c.TransactionID = @TransactionID
      AND c.Status = 'Active'
    ORDER BY c.CreatedAt DESC;
END;
GO
