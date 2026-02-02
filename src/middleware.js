const jwt = require('jsonwebtoken');

function authJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        next();
    }
}

function errorHandler(err, req, res, next) {
    console.error(err);
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Server error';
    res.status(status).json({ message });
}

module.exports = { authJWT, requireRole, errorHandler }