USE master;
GO

CREATE LOGIN hb_resort_login
WITH PASSWORD = 'HbResort@2026',
CHECK_POLICY = OFF;
GO

USE Holybird_Resort_db;
GO

CREATE USER hb_resort_user
FOR LOGIN hb_resort_login;
GO

ALTER ROLE db_datareader ADD MEMBER hb_resort_user;
ALTER ROLE db_datawriter ADD MEMBER hb_resort_user;
GO

GRANT EXECUTE TO hb_resort_user;
GO
