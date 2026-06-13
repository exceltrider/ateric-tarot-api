const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const redis = require('../config/redis');
const { JWT_SECRET, ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } = require('../config/auth');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
        res.status(201).json({ message: 'User berhasil dibuat' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }
        console.error('Register error:', err);
        res.status(500).json({ error: err.message || 'Gagal mendaftar' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: 'Username atau password salah' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Username atau password salah' });

        const accessToken = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES }
        );

        const refreshToken = uuidv4();
        await redis.set(`refresh_token:${refreshToken}`, user.id, 'EX', REFRESH_TOKEN_EXPIRES);

        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Gagal login' });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token diperlukan' });

    try {
        const userId = await redis.get(`refresh_token:${refreshToken}`);
        if (!userId) return res.status(401).json({ error: 'Refresh token tidak valid atau kadaluarsa' });

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

        const user = users[0];

        await redis.del(`refresh_token:${refreshToken}`);
        const newRefreshToken = uuidv4();
        await redis.set(`refresh_token:${newRefreshToken}`, user.id, 'EX', REFRESH_TOKEN_EXPIRES);

        const accessToken = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES }
        );

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(500).json({ error: err.message || 'Gagal refresh token' });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];

    try {
        if (refreshToken) await redis.del(`refresh_token:${refreshToken}`);

        if (accessToken) {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
                const expiry = decoded.exp - Math.floor(Date.now() / 1000);
                if (expiry > 0) {
                    await redis.set(`blacklist:${accessToken}`, '1', 'EX', expiry);
                }
            }
        }

        res.json({ message: 'Logout berhasil' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: err.message || 'Gagal logout' });
    }
});

module.exports = router;