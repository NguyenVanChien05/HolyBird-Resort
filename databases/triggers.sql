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
