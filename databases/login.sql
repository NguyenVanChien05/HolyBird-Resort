USE HolybirdResort;
GO

CREATE LOGIN your_username
WITH PASSWORD = 'your_password',
CHECK_POLICY = OFF;
GO

CREATE USER your_username FOR LOGIN your_username;
GO

ALTER ROLE db_datareader ADD MEMBER your_username;
ALTER ROLE db_datawriter ADD MEMBER your_username;
GO



