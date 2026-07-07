const { verifyAccessToken } = require('../services/tokenService');
const logger = require('../config/logger');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('Auth middleware: invalid token', { error: error.message });
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

module.exports = authMiddleware;
