const { pool, sql } = require('../config/db');

// Lấy tất cả khách
const getGuests = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Guest');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy khách theo ID
const getGuestById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Guest WHERE GuestID=@id');
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Không tìm thấy khách' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Tạo khách
const createGuest = async (req, res) => {
    const { FullName, CMND } = req.body;
    try {
        await pool.request()
            .input('FullName', sql.NVarChar(100), FullName)
            .input('CMND', sql.VarChar(12), CMND)
            .query('INSERT INTO Guest (FullName, CMND) VALUES (@FullName, @CMND)');
        res.json({ success: true, message: 'Tạo khách thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật khách
const updateGuest = async (req, res) => {
    const { id } = req.params;
    const { FullName, CMND } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('FullName', sql.NVarChar(100), FullName)
            .input('CMND', sql.VarChar(12), CMND)
            .query('UPDATE Guest SET FullName=@FullName, CMND=@CMND WHERE GuestID=@id');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa khách
const deleteGuest = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Guest WHERE GuestID=@id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getGuests, getGuestById, createGuest, updateGuest, deleteGuest };
