const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Mendapatkan semua layanan
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Daftar layanan
 */
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services');
  res.json(rows);
});

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Mendapatkan satu layanan
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Data layanan
 */
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Service not found' });
  res.json(rows[0]);
});

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Membuat layanan baru
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: string
 *               price: number
 *               description: string
 *     responses:
 *       201:
 *         description: Layanan berhasil dibuat
 */
router.post('/', async (req, res) => {
  const { name, price, description } = req.body;
  const [result] = await pool.query('INSERT INTO services (name, price, description) VALUES (?, ?, ?)', [name, price, description]);
  res.status(201).json({ id: result.insertId, name, price, description });
});

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Mengubah data layanan
 *     tags: [Services]
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
 *               name: string
 *               price: number
 *               description: string
 *     responses:
 *       200:
 *         description: Layanan berhasil diubah
 */
router.put('/:id', async (req, res) => {
  const { name, price, description } = req.body;
  await pool.query('UPDATE services SET name=?, price=?, description=? WHERE id=?', [name, price, description, req.params.id]);
  res.json({ message: 'Service updated' });
});

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Menghapus layanan
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Layanan berhasil dihapus
 */
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM services WHERE id=?', [req.params.id]);
  res.json({ message: 'Service deleted' });
});

module.exports = router;