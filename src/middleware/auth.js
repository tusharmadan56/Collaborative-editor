const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT authentication middleware for Express routes.
 * Extracts token from Authorization header (Bearer scheme),
 * verifies it, and attaches user info to req.user.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Verify a JWT token and return the decoded payload.
 * Used by socket authentication.
 * @param {string} token
 * @returns {{ id: string, email: string }}
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { authMiddleware, verifyToken };
