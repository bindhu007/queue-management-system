const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(manager) {
  return jwt.sign(
    { id: manager.id, username: manager.username, email: manager.email, role: manager.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginId = identifier || email || username;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password' });
    }

    const manager = db.prepare(`
      SELECT * FROM managers WHERE email = ? OR username = ?
    `).get(loginId.trim().toLowerCase(), loginId.trim());

    if (!manager) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const isMatch = bcrypt.compareSync(password, manager.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const token = generateToken(manager);
    const { password_hash, ...managerProfile } = manager;

    return res.json({
      message: 'Login successful',
      token,
      manager: managerProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /api/auth/demo-login (Convenient 1-click evaluator login)
router.post('/demo-login', (req, res) => {
  try {
    const manager = db.prepare('SELECT * FROM managers WHERE email = ?').get('manager@qflow.com')
      || db.prepare('SELECT * FROM managers LIMIT 1').get();

    if (!manager) {
      return res.status(404).json({ error: 'No demo manager account found. Please register or reseed database.' });
    }

    const token = generateToken(manager);
    const { password_hash, ...managerProfile } = manager;

    return res.json({
      message: 'Demo login successful',
      token,
      manager: managerProfile
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Internal server error during demo login' });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields (username, email, password, name) are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = db.prepare('SELECT id FROM managers WHERE email = ? OR username = ?').get(email.trim().toLowerCase(), username.trim());
    if (existing) {
      return res.status(409).json({ error: 'A manager with this email or username already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO managers (username, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(username.trim(), email.trim().toLowerCase(), passwordHash, name.trim(), 'manager');

    const newManager = db.prepare('SELECT id, username, email, name, role, created_at FROM managers WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newManager);

    return res.status(201).json({
      message: 'Manager registered successfully',
      token,
      manager: newManager
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ manager: req.manager });
});

module.exports = router;
