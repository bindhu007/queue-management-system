#!/usr/bin/env bash

# Q-Flow Full-Stack Queue Management System Startup Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo "  🚀 Starting Q-Flow Queue Management System"
echo "========================================================"

# Run test suite first to ensure system integrity
echo "🧪 Running automated verification tests..."
node server/tests/api.test.js

# Build client if dist doesn't exist
if [ ! -d "client/dist" ]; then
  echo "📦 Building frontend production bundle..."
  (cd client && ./node_modules/.bin/vite build)
fi

echo "--------------------------------------------------------"
echo "  🌐 Backend API & WebSockets : http://localhost:5001"
echo "  🖥️  Full-Stack Application  : http://localhost:5001"
echo "  ⚡ Demo Manager Login       : manager@qflow.com / admin123"
echo "--------------------------------------------------------"

# Launch server
exec node server/src/server.js
