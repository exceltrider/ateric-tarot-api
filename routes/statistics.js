const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Mendapatkan statistik transaksi
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Data statistik
 */
router.get('/', async (req, res) => {
  const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
  const [[{ totalRevenue }]] = await pool.query('SELECT SUM(total_amount) as totalRevenue FROM orders WHERE status != "pending"');
  const [perService] = await pool.query(
    `SELECT s.name, COUNT(oi.id) as count, SUM(oi.subtotal) as revenue 
     FROM order_items oi 
     JOIN services s ON oi.service_id = s.id 
     JOIN orders o ON oi.order_id = o.id 
     WHERE o.status != 'pending'
     GROUP BY s.id`
  );
  const [statusStats] = await pool.query(
    `SELECT status, COUNT(*) as count 
     FROM orders 
     GROUP BY status`
  );
  res.json({ totalOrders, totalRevenue, perService, statusStats });
});

module.exports = router;