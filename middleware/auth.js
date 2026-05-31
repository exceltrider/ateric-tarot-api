const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Format token salah. Gunakan: Bearer <token>' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }
};

module.exports = authenticate;