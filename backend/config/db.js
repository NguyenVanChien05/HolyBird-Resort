const sql = require('mssql');
require('dotenv').config();

const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || 'Holybird_Resort_db',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('🚀 Kết nối DB thành công!');
    } catch (err) {
        console.error('❌ Lỗi kết nối DB:', err);
    }
};


module.exports = { sql, pool, connectDB };
