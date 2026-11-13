const express = require('express');
const router = express.Router();
const { db, resetAndSeedDemo } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper to compute minutes between two date strings
function diffInMinutes(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const diffMs = Math.max(0, end - start);
  return Math.round((diffMs / 60000) * 10) / 10;
}

// GET /api/analytics/dashboard (Req 8: wait times, queue length trends, status distribution)
router.get('/dashboard', (req, res) => {
  try {
    const { queue_id, range } = req.query;
    let queueFilter = '';
    const params = [];

    if (queue_id && queue_id !== 'all') {
      queueFilter = ' AND queue_id = ?';
      params.push(Number(queue_id));
    }

    // 1. Overall counts
    const counts = db.prepare(`
      SELECT
        COUNT(*) as total_tokens,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting_count,
        SUM(CASE WHEN status = 'IN_SERVICE' THEN 1 ELSE 0 END) as in_service_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
      FROM tokens
      WHERE 1=1 ${queueFilter}
    `).get(...params);

    // 2. Wait time & service time calculation (for tokens that have been served or completed)
    const servedTokens = db.prepare(`
      SELECT 
        id, token_number, created_at, served_at, completed_at, priority, queue_id
      FROM tokens
      WHERE served_at IS NOT NULL ${queueFilter}
    `).all(...params);

    let totalWaitMinutes = 0;
    let maxWaitMinutes = 0;
    let totalServiceMinutes = 0;
    let completedTokensWithDuration = 0;

    servedTokens.forEach(t => {
      const waitMin = diffInMinutes(t.created_at, t.served_at);
      totalWaitMinutes += waitMin;
      if (waitMin > maxWaitMinutes) {
        maxWaitMinutes = waitMin;
      }

      if (t.completed_at) {
        const serviceMin = diffInMinutes(t.served_at, t.completed_at);
        totalServiceMinutes += serviceMin;
        completedTokensWithDuration++;
      }
    });

    const avgWaitTimeMinutes = servedTokens.length > 0 
      ? Math.round((totalWaitMinutes / servedTokens.length) * 10) / 10 
      : 4.5; // fallback default if new system

    const avgServiceTimeMinutes = completedTokensWithDuration > 0
      ? Math.round((totalServiceMinutes / completedTokensWithDuration) * 10) / 10
      : 7.2;

    // 3. Hourly Queue Length Trends (Tokens created vs served across hours)
    // We group by hour of day (09, 10, 11, etc.)
    const hourlyCreated = db.prepare(`
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as count
      FROM tokens
      WHERE 1=1 ${queueFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...params);

    const hourlyServed = db.prepare(`
      SELECT 
        strftime('%H', served_at) as hour,
        COUNT(*) as count
      FROM tokens
      WHERE served_at IS NOT NULL ${queueFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...params);

    // Build complete trend timeline for daytime business hours (08:00 to 18:00)
    const trendMap = {};
    for (let h = 8; h <= 18; h++) {
      const hStr = String(h).padStart(2, '0');
      trendMap[hStr] = {
        hour: `${hStr}:00`,
        incoming: 0,
        served: 0,
        waitingEst: 0
      };
    }

    hourlyCreated.forEach(row => {
      if (trendMap[row.hour]) {
        trendMap[row.hour].incoming = row.count;
      }
    });

    hourlyServed.forEach(row => {
      if (trendMap[row.hour]) {
        trendMap[row.hour].served = row.count;
      }
    });

    // Compute cumulative waiting estimation
    let rollingWaiting = 0;
    const hourlyTrends = Object.values(trendMap).map(item => {
      rollingWaiting = Math.max(0, rollingWaiting + item.incoming - item.served);
      return {
        ...item,
        waitingEst: rollingWaiting
      };
    });

    // 4. Queue-by-Queue Comparison
    const queueComparison = db.prepare(`
      SELECT 
        q.id,
        q.name,
        q.prefix,
        COUNT(t.id) as total_tokens,
        SUM(CASE WHEN t.status = 'WAITING' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN t.status = 'IN_SERVICE' THEN 1 ELSE 0 END) as in_service,
        SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM queues q
      LEFT JOIN tokens t ON q.id = t.queue_id
      GROUP BY q.id
      ORDER BY total_tokens DESC
    `).all();

    // 5. Priority Distribution
    const priorityBreakdown = db.prepare(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM tokens
      WHERE 1=1 ${queueFilter}
      GROUP BY priority
    `).all(...params);

    // 6. Cancellation Reasons Breakdown
    const cancellationReasons = db.prepare(`
      SELECT 
        COALESCE(cancellation_reason, 'Unspecified') as reason,
        COUNT(*) as count
      FROM tokens
      WHERE status = 'CANCELLED' ${queueFilter}
      GROUP BY reason
    `).all(...params);

    // 7. Recent events feed
    const recentEvents = db.prepare(`
      SELECT e.*, q.name as queue_name
      FROM queue_events e
      LEFT JOIN queues q ON e.queue_id = q.id
      ORDER BY e.timestamp DESC LIMIT 12
    `).all();

    // Return structured analytics payload
    return res.json({
      kpis: {
        totalTokens: counts.total_tokens || 0,
        waiting: counts.waiting_count || 0,
        inService: counts.in_service_count || 0,
        completed: counts.completed_count || 0,
        cancelled: counts.cancelled_count || 0,
        avgWaitTimeMinutes,
        avgServiceTimeMinutes,
        maxWaitTimeMinutes,
        estimatedNextWaitMinutes: Math.round((counts.waiting_count || 1) * avgServiceTimeMinutes * 10) / 10
      },
      hourlyTrends,
      queueComparison,
      priorityBreakdown,
      cancellationReasons,
      statusDistribution: [
        { name: 'Completed', value: counts.completed_count || 0, color: '#10b981' },
        { name: 'Waiting', value: counts.waiting_count || 0, color: '#6366f1' },
        { name: 'In Service', value: counts.in_service_count || 0, color: '#f59e0b' },
        { name: 'Cancelled', value: counts.cancelled_count || 0, color: '#ef4444' }
      ],
      recentEvents
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return res.status(500).json({ error: 'Failed to generate analytics dashboard' });
  }
});

// POST /api/analytics/reseed (One-click demo reseed for testing)
router.post('/reseed', authenticateToken, (req, res) => {
  try {
    const result = resetAndSeedDemo();
    return res.json(result);
  } catch (err) {
    console.error('Error reseeding demo data:', err);
    return res.status(500).json({ error: 'Failed to reseed database' });
  }
});

module.exports = router;
