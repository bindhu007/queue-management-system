const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Ensure db initializes and seeds if needed
require('./db');

const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const queueRoutes = require('./routes/queues');
const tokenRoutes = require('./routes/tokens');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

initSocket(io);

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Q-Flow Queue Management System API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Catch-all route to serve React index.html for client-side routing if dist exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Q-Flow API Server is running. Start the Vite client dev server or run `npm run build` to serve static assets.');
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Q-Flow Queue Management Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
});

module.exports = { app, server };
