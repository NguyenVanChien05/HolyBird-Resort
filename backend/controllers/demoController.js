const { pool, sql } = require('../config/db');

// Helper to get connected pool
async function getPool() {
    if (pool.connected) return pool;
    console.log('Reconnecting to DB in Controller...');
    await pool.connect();
    return pool;
}

const demoController = {
    // T1: Cancel Transaction (Slow)
    cancelTransaction: async (req, res) => {
        const { transactionId, useFix } = req.body;
        console.log(`[T1] Request Cancel: ID=${transactionId}, Fix=${useFix}`);

        try {
            const currentPool = await getPool();
            const procedureName = useFix ? 'sp_HuyGiaoDich_Fix' : 'sp_HuyGiaoDich';

            const request = currentPool.request();
            request.input('MaGiaoDich', sql.Int, transactionId);

            console.log(`[T1] Executing ${procedureName}...`);
            const result = await request.execute(procedureName);

            console.log(`[T1] Result:`, result.recordset ? result.recordset[0] : 'No result');
            res.json({
                success: true,
                message: useFix ? 'Đã hủy giao dịch (FIX)' : 'Đã hủy giao dịch (Lỗi)',
                data: result.recordset
            });

        } catch (err) {
            console.error('[T1] Error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // T2: Confirm Transaction (Fast)
    confirmTransaction: async (req, res) => {
        const { transactionId, useFix } = req.body;
        console.log(`[T2] Request Confirm: ID=${transactionId}, Fix=${useFix}`);

        try {
            const currentPool = await getPool();
            const procedureName = useFix ? 'sp_CapTaiKhoan_Fix' : 'sp_CapTaiKhoan';

            const request = currentPool.request();
            request.input('MaGiaoDich', sql.Int, transactionId);

            console.log(`[T2] Executing ${procedureName}...`);
            const result = await request.execute(procedureName);

            console.log(`[T2] Result:`, result.recordset ? result.recordset[0] : 'No result');
            res.json({
                success: true,
                message: useFix ? 'Đã xác nhận (FIX)' : 'Đã xác nhận (Lỗi)',
                data: result.recordset
            });

        } catch (err) {
            console.error('[T2] Error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Reset Data Helper
    resetData: async (req, res) => {
        const { transactionId } = req.body;
        try {
            const currentPool = await getPool();
            // Reset BookingTransaction status to 'Pending'
            await currentPool.request()
                .input('ID', sql.Int, transactionId)
                .query("UPDATE BookingTransaction SET Status = 'Pending' WHERE TransactionID = @ID");

            res.json({ success: true, message: `Đã reset Transaction ${transactionId} về Pending` });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Get Status
    getStatus: async (req, res) => {
        const { transactionId } = req.params;
        try {
            const currentPool = await getPool();
            const result = await currentPool.request()
                .input('ID', sql.Int, transactionId)
                .query("SELECT TransactionID, Status FROM BookingTransaction WHERE TransactionID = @ID");

            res.json({ success: true, data: result.recordset[0] });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = demoController;
