const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { broadcastQueueUpdate } = require('../socket');

// GET /api/queues (Public or Authenticated: list active queues with live stats)
router.get('/', (req, res) => {
  try {
    const queues = db.prepare(`
      SELECT 
        q.*,
        (SELECT COUNT(*) FROM tokens WHERE queue_id = q.id AND status = 'WAITING') as waiting_count,
        (SELECT COUNT(*) FROM tokens WHERE queue_id = q.id AND status = 'IN_SERVICE') as serving_count,
        (SELECT COUNT(*) FROM tokens WHERE queue_id = q.id AND status = 'COMPLETED') as completed_count,
        (SELECT COUNT(*) FROM tokens WHERE queue_id = q.id AND status = 'CANCELLED') as cancelled_count,
        (SELECT token_number FROM tokens WHERE queue_id = q.id AND status = 'IN_SERVICE' ORDER BY served_at DESC LIMIT 1) as current_serving_token,
        (SELECT customer_name FROM tokens WHERE queue_id = q.id AND status = 'IN_SERVICE' ORDER BY served_at DESC LIMIT 1) as current_serving_customer
      FROM queues q
      ORDER BY q.created_at ASC
    `).all();

    return res.json({ queues });
  } catch (err) {
    console.error('Error fetching queues:', err);
    return res.status(500).json({ error: 'Failed to fetch queues' });
  }
});

// GET /api/queues/:id (Single queue details with waiting tokens & active serving)
router.get('/:id', (req, res) => {
  try {
    const queueId = Number(req.params.id);
    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Currently in-service token
    const inServiceToken = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'IN_SERVICE' 
      ORDER BY served_at DESC LIMIT 1
    `).get(queueId);

    // Waiting tokens ordered by position
    const waitingTokens = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'WAITING' 
      ORDER BY position ASC
    `).all(queueId);

    // Recently completed or cancelled tokens
    const recentActivity = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status IN ('COMPLETED', 'CANCELLED') 
      ORDER BY COALESCE(completed_at, cancelled_at) DESC LIMIT 10
    `).all(queueId);

    return res.json({
      queue,
      inServiceToken: inServiceToken || null,
      waitingTokens,
      recentActivity,
      stats: {
        waitingCount: waitingTokens.length,
        inServiceCount: inServiceToken ? 1 : 0
      }
    });
  } catch (err) {
    console.error('Error fetching queue detail:', err);
    return res.status(500).json({ error: 'Failed to fetch queue details' });
  }
});

// POST /api/queues (Create a new Queue - requires manager auth)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, prefix, description, counter_name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Queue name is required' });
    }

    // Auto-generate prefix if not provided (e.g. "Express Billing" -> "EXPR")
    let queuePrefix = prefix ? prefix.trim().toUpperCase() : '';
    if (!queuePrefix) {
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) {
        queuePrefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
      } else {
        queuePrefix = words[0].substring(0, 4).toUpperCase();
      }
    }

    const counter = counter_name && counter_name.trim() ? counter_name.trim() : 'Counter 1';

    const result = db.prepare(`
      INSERT INTO queues (name, prefix, description, counter_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      queuePrefix,
      description ? description.trim() : '',
      counter,
      req.manager.id
    );

    const newQueue = db.prepare('SELECT * FROM queues WHERE id = ?').get(result.lastInsertRowid);

    // Log event
    db.prepare(`
      INSERT INTO queue_events (queue_id, event_type, details)
      VALUES (?, 'QUEUE_CREATED', ?)
    `).run(newQueue.id, `Created queue "${newQueue.name}" with prefix "${newQueue.prefix}"`);

    broadcastQueueUpdate({ type: 'QUEUE_CREATED', queue: newQueue });

    return res.status(201).json({
      message: 'Queue created successfully',
      queue: newQueue
    });
  } catch (err) {
    console.error('Error creating queue:', err);
    return res.status(500).json({ error: 'Failed to create queue' });
  }
});

// PUT /api/queues/:id (Update Queue settings)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const queueId = Number(req.params.id);
    const { name, prefix, description, counter_name, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);
    if (!existing) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    db.prepare(`
      UPDATE queues 
      SET 
        name = COALESCE(?, name),
        prefix = COALESCE(?, prefix),
        description = COALESCE(?, description),
        counter_name = COALESCE(?, counter_name),
        is_active = COALESCE(?, is_active),
        updated_at = (datetime('now', 'localtime'))
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      prefix ? prefix.trim().toUpperCase() : null,
      description !== undefined ? description.trim() : null,
      counter_name ? counter_name.trim() : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      queueId
    );

    const updatedQueue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);
    broadcastQueueUpdate({ type: 'QUEUE_UPDATED', queue: updatedQueue });

    return res.json({
      message: 'Queue updated successfully',
      queue: updatedQueue
    });
  } catch (err) {
    console.error('Error updating queue:', err);
    return res.status(500).json({ error: 'Failed to update queue' });
  }
});

// DELETE /api/queues/:id (Delete Queue)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const queueId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);
    if (!existing) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    db.prepare('DELETE FROM queues WHERE id = ?').run(queueId);
    broadcastQueueUpdate({ type: 'QUEUE_DELETED', queueId });

    return res.json({ message: `Queue "${existing.name}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting queue:', err);
    return res.status(500).json({ error: 'Failed to delete queue' });
  }
});

module.exports = router;
