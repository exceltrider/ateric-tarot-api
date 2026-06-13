const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const { JWT_SECRET } = require('../config/auth');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token tidak ditemukan' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Format token salah' });

    try {
        const blacklisted = await redis.get(`blacklist:${token}`);
        if (blacklisted) return res.status(401).json({ error: 'Token sudah logout, silakan login ulang' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid atau kadaluwarsa' });
    }
};

module.exports = authenticate;