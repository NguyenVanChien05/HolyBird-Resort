USE Holybird_Resort_db
GO

-- BookingDetail
CREATE INDEX IX_BookingDetail_TransactionID
ON BookingDetail(TransactionID);

CREATE INDEX IX_BookingDetail_RoomID
ON BookingDetail(RoomID);

CREATE INDEX IX_BookingDetail_GuestID
ON BookingDetail(GuestID);

-- Room
CREATE INDEX IX_Room_RankID_TypeID
ON Room(RankID, TypeID);

CREATE INDEX IX_Room_StatusPhysic
ON Room(StatusPhysic);

-- BookingTransaction
CREATE INDEX IX_BookingTransaction_GroupID
ON BookingTransaction(GroupID);

-- KeyCard
CREATE INDEX IX_KeyCard_RoomID
ON KeyCard(RoomID);

-- Guest (n?u th??ng search theo CMND)
CREATE INDEX IX_Guest_CMND
ON Guest(CMND);

GO
