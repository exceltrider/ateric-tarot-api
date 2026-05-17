const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         instagram:
 *           type: string
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Mendapatkan semua pelanggan
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Daftar pelanggan
 */
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers');
  res.json(rows);
});

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Mendapatkan satu pelanggan
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Data pelanggan
 */
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
  res.json(rows[0]);
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Menambah pelanggan baru
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: string
 *               email: string
 *               phone: string
 *               instagram: string
 *     responses:
 *       201:
 *         description: Pelanggan berhasil ditambah
 */
router.post('/', async (req, res) => {
  const { name, email, phone, instagram } = req.body;
  const [result] = await pool.query('INSERT INTO customers (name, email, phone, instagram) VALUES (?, ?, ?, ?)', [name, email, phone, instagram]);
  res.status(201).json({ id: result.insertId, name, email, phone, instagram });
});

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Mengubah data pelanggan
 *     tags: [Customers]
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
 *               email: string
 *               phone: string
 *               instagram: string
 *     responses:
 *       200:
 *         description: Data pelanggan berhasil diubah
 */
router.put('/:id', async (req, res) => {
  const { name, email, phone, instagram } = req.body;
  await pool.query('UPDATE customers SET name=?, email=?, phone=?, instagram=? WHERE id=?', [name, email, phone, instagram, req.params.id]);
  res.json({ message: 'Customer updated' });
});

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Menghapus pelanggan
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Pelanggan berhasil dihapus
 */
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
  res.json({ message: 'Customer deleted' });
});

module.exports = router;