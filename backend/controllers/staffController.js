const { pool, sql } = require('../config/db');

// Lấy tất cả nhân viên
const getStaffs = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Staff');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy nhân viên theo ID
const getStaffById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Staff WHERE StaffID=@id');
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Tạo nhân viên
const createStaff = async (req, res) => {
    const { StaffName, AccountID } = req.body;
    try {
        await pool.request()
            .input('StaffName', sql.NVarChar(100), StaffName)
            .input('AccountID', sql.Int, AccountID)
            .query('INSERT INTO Staff (StaffName, AccountID) VALUES (@StaffName, @AccountID)');
        res.json({ success: true, message: 'Tạo nhân viên thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật nhân viên
const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { StaffName, AccountID } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('StaffName', sql.NVarChar(100), StaffName)
            .input('AccountID', sql.Int, AccountID)
            .query('UPDATE Staff SET StaffName=@StaffName, AccountID=@AccountID WHERE StaffID=@id');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa nhân viên
const deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Staff WHERE StaffID=@id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getStaffs, getStaffById, createStaff, updateStaff, deleteStaff };
