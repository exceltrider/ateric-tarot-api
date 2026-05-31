const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login untuk mendapatkan token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil, token diberikan
 *       401:
 *         description: Username atau password salah
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login berhasil',
            token: token,
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Membuat user baru (untuk inisialisasi)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User berhasil dibuat',
            userId: result.insertId 
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;