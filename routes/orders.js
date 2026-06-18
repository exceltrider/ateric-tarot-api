const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Mendapatkan semua pesanan beserta detailnya
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Daftar pesanan
 */
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, c.name AS customer_name, c.email AS customer_email, c.instagram AS customer_instagram
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC
    `);
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, s.name AS service_name 
         FROM order_items oi 
         JOIN services s ON oi.service_id = s.id 
         WHERE oi.order_id = ?`, [order.id]
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Gagal mengambil data pesanan' });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Membuat pesanan baru
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     service_id: integer
 *                     quantity: integer
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 */
router.post('/', async (req, res) => {
  const { customer_id, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    for (let item of items) {
      const [[service]] = await conn.query('SELECT price FROM services WHERE id = ?', [item.service_id]);
      if (!service) throw new Error(`Service id ${item.service_id} tidak ditemukan`);
      total += service.price * item.quantity;
    }
    const [orderResult] = await conn.query('INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)', [customer_id, total]);
    const orderId = orderResult.insertId;
    for (let item of items) {
      const [[service]] = await conn.query('SELECT price FROM services WHERE id = ?', [item.service_id]);
      const subtotal = service.price * item.quantity;
      await conn.query('INSERT INTO order_items (order_id, service_id, quantity, subtotal) VALUES (?, ?, ?, ?)', [orderId, item.service_id, item.quantity, subtotal]);
    }
    await conn.commit();
    res.status(201).json({ order_id: orderId, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Mengubah status pesanan
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, done]
 *     responses:
 *       200:
 *         description: Status berhasil diubah
 */
router.put('/:id/status', async (req, res) => {
  await pool.query('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
  res.json({ message: 'Status updated' });
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Menghapus pesanan
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Pesanan berhasil dihapus
 */
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM order_items WHERE order_id=?', [req.params.id]);
  await pool.query('DELETE FROM orders WHERE id=?', [req.params.id]);
  res.json({ message: 'Order deleted' });
});

module.exports = router;