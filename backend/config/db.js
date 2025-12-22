const sql = require('mssql');
require('dotenv').config();

const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true 
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
