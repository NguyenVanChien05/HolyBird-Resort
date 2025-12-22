const { pool, sql } = require('../config/db');

// Lấy tất cả tài khoản
const getAccounts = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Account');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy tài khoản theo ID
const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Account WHERE AccountID = @id');
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Tạo tài khoản mới
const createAccount = async (req, res) => {
    try {
        const { Username, Password, Role } = req.body;
        await pool.request()
            .input('Username', sql.VarChar(50), Username)
            .input('Password', sql.VarChar(100), Password)
            .input('Role', sql.VarChar(10), Role)
            .query('INSERT INTO Account (Username, Password, Role) VALUES (@Username, @Password, @Role)');
        res.json({ success: true, message: 'Tạo tài khoản thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật tài khoản
const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { Username, Password, Role } = req.body;
        await pool.request()
            .input('id', sql.Int, id)
            .input('Username', sql.VarChar(50), Username)
            .input('Password', sql.VarChar(100), Password)
            .input('Role', sql.VarChar(10), Role)
            .query('UPDATE Account SET Username=@Username, Password=@Password, Role=@Role WHERE AccountID=@id');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa tài khoản
const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Account WHERE AccountID=@id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount };
