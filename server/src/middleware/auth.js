const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'qflow-secure-jwt-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const manager = db.prepare('SELECT id, username, email, name, role FROM managers WHERE id = ?').get(decoded.id);

    if (!manager) {
      return res.status(401).json({ error: 'Manager session expired or user no longer exists.' });
    }

    req.manager = manager;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
