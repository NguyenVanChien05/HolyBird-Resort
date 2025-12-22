USE HolybirdResort;
GO

CREATE LOGIN resort_app
WITH PASSWORD = 'Resort@123',
CHECK_POLICY = OFF;
GO

CREATE USER resort_app FOR LOGIN resort_app;
GO

ALTER ROLE db_datareader ADD MEMBER resort_app;
ALTER ROLE db_datawriter ADD MEMBER resort_app;
GO



