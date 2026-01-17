const sql = require('mssql');
require('dotenv').config();

const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    instanceName: process.env.DB_INSTANCE,
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
