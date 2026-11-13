const express = require('express');
const cors = require('cors');

// Ensure db initializes in /tmp on Vercel
require('../server/src/db');

const authRoutes = require('../server/src/routes/auth');
const queueRoutes = require('../server/src/routes/queues');
const tokenRoutes = require('../server/src/routes/tokens');
const analyticsRoutes = require('../server/src/routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());

// Support both /api/* and non-prefixed paths on Vercel
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/auth', authRoutes);
app.use('/queues', queueRoutes);
app.use('/tokens', tokenRoutes);
app.use('/analytics', analyticsRoutes);

app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
