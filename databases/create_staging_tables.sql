IF OBJECT_ID('Staff_Staging', 'U') IS NOT NULL DROP TABLE Staff_Staging;
IF OBJECT_ID('Guest_Staging', 'U') IS NOT NULL DROP TABLE Guest_Staging;

CREATE TABLE Staff_Staging (
    first_name NVARCHAR(100),
    middle_name NVARCHAR(100),
    last_name NVARCHAR(100),
    StaffName NVARCHAR(200)
);

CREATE TABLE Guest_Staging (
    first_name NVARCHAR(100),
    middle_name NVARCHAR(100),
    last_name NVARCHAR(100),
    FullName NVARCHAR(200),
    CMND VARCHAR(50)
);
