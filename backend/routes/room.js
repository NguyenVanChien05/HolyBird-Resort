const express = require('express');
const router = express.Router();
const { pool, sql } = require('../config/db');

/* ================= GET ROOMS ================= */
router.get('/', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        r.RoomID, r.RoomNumber, r.FloorNumber, r.StatusPhysic,
        rr.RankID, rr.RankName,
        rt.TypeID, rt.TypeName,
        pr.Price
      FROM Room r
      JOIN RankRoom rr ON r.RankID = rr.RankID
      JOIN RoomType rt ON r.TypeID = rt.TypeID
      LEFT JOIN PriceRoom pr 
        ON pr.RankID = r.RankID AND pr.TypeID = r.TypeID
      ORDER BY r.FloorNumber, r.RoomNumber
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ROOM STATUS ================= */
router.put('/:id/status', async (req, res) => {
  const { StatusPhysic } = req.body;

  try {
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, StatusPhysic)
      .query(`
        UPDATE Room
        SET StatusPhysic = @status
        WHERE RoomID = @id
      `);

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE PRICE BY RANK + TYPE ================= */
router.put('/price', async (req, res) => {
  const { RankID, TypeID, Price } = req.body;

  try {
    await pool.request()
      .input('rank', sql.Int, RankID)
      .input('type', sql.Int, TypeID)
      .input('price', sql.Money, Price)
      .query(`
        UPDATE PriceRoom
        SET Price = @price
        WHERE RankID = @rank AND TypeID = @type
      `);

    res.json({ message: 'Price updated for all matching rooms' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
