const express = require('express');
const router = express.Router();
const { db, runTransaction } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { broadcastQueueUpdate } = require('../socket');

// Helper to format token number (e.g., BILL-001, VIP-042)
function formatTokenNumber(prefix, seqNumber) {
  const padded = String(seqNumber).padStart(3, '0');
  return `${prefix}-${padded}`;
}

// GET /api/tokens (Filter by queue_id, status, search)
router.get('/', (req, res) => {
  try {
    const { queue_id, status, search } = req.query;
    let query = 'SELECT t.*, q.name as queue_name, q.counter_name FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE 1=1';
    const params = [];

    if (queue_id) {
      query += ' AND t.queue_id = ?';
      params.push(Number(queue_id));
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (t.customer_name LIKE ? OR t.token_number LIKE ? OR t.customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Sort: if WAITING sort by position ASC; otherwise sort by recent updates
    if (status === 'WAITING') {
      query += ' ORDER BY t.position ASC';
    } else {
      query += ' ORDER BY COALESCE(t.served_at, t.completed_at, t.created_at) DESC';
    }

    const tokens = db.prepare(query).all(...params);
    return res.json({ tokens });
  } catch (err) {
    console.error('Error fetching tokens:', err);
    return res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// POST /api/tokens (Add new person / token into queue - Req 3)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { queue_id, customer_name, customer_phone, customer_email, priority, notes } = req.body;

    if (!queue_id || !customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Queue ID and customer name are required' });
    }

    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(Number(queue_id));
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const result = runTransaction(() => {
      // Find today's max sequence number for this queue
      const maxSeqRow = db.prepare(`
        SELECT COALESCE(MAX(sequence_number), 0) as max_seq 
        FROM tokens 
        WHERE queue_id = ? AND date(created_at) = date('now', 'localtime')
      `).get(queue.id);

      const nextSeq = maxSeqRow.max_seq + 1;
      const tokenNumber = formatTokenNumber(queue.prefix, nextSeq);

      // Find highest waiting position in this queue
      const maxPosRow = db.prepare(`
        SELECT COALESCE(MAX(position), 0) as max_pos 
        FROM tokens 
        WHERE queue_id = ? AND status = 'WAITING'
      `).get(queue.id);

      const nextPos = maxPosRow.max_pos + 1;
      const prio = priority && ['standard', 'vip', 'priority'].includes(priority.toLowerCase())
        ? priority.toLowerCase()
        : 'standard';

      const insertRes = db.prepare(`
        INSERT INTO tokens (
          queue_id, token_number, sequence_number, customer_name, customer_phone, 
          customer_email, priority, notes, position, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING')
      `).run(
        queue.id,
        tokenNumber,
        nextSeq,
        customer_name.trim(),
        customer_phone ? customer_phone.trim() : null,
        customer_email ? customer_email.trim().toLowerCase() : null,
        prio,
        notes ? notes.trim() : null,
        nextPos
      );

      const tokenId = insertRes.lastInsertRowid;

      // Log event
      db.prepare(`
        INSERT INTO queue_events (queue_id, token_id, event_type, details)
        VALUES (?, ?, 'TOKEN_CREATED', ?)
      `).run(queue.id, tokenId, `Token ${tokenNumber} created for ${customer_name.trim()} at position #${nextPos}`);

      const createdToken = db.prepare(`
        SELECT t.*, q.name as queue_name, q.counter_name 
        FROM tokens t 
        JOIN queues q ON t.queue_id = q.id 
        WHERE t.id = ?
      `).get(tokenId);

      return createdToken;
    });

    broadcastQueueUpdate({
      type: 'TOKEN_CREATED',
      queueId: queue.id,
      token: result
    });

    return res.status(201).json({
      message: `Token ${result.token_number} generated successfully for ${result.customer_name}`,
      token: result
    });
  } catch (err) {
    console.error('Error creating token:', err);
    return res.status(500).json({ error: 'Failed to create token' });
  }
});

// POST /api/tokens/:id/move-up (Move token UP in queue - Req 5)
router.post('/:id/move-up', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be moved in the queue' });
    }

    if (token.position <= 1) {
      return res.status(400).json({ error: 'Token is already at the top of the queue' });
    }

    const currentPos = token.position;
    const targetPos = currentPos - 1;

    // Find the predecessor token currently at targetPos
    const predecessor = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'WAITING' AND position = ?
    `).get(token.queue_id, targetPos);

    if (!predecessor) {
      // If position gap existed, normalize position to targetPos
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(targetPos, tokenId);
    } else {
      // Atomic swap using a temporary negative position to avoid any potential unique index conflicts
      runTransaction(() => {
        db.prepare('UPDATE tokens SET position = -1 WHERE id = ?').run(token.id);
        db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(currentPos, predecessor.id);
        db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(targetPos, token.id);
      });
    }

    const updatedQueueTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(token.queue_id);

    broadcastQueueUpdate({
      type: 'QUEUE_REORDERED',
      queueId: token.queue_id,
      tokens: updatedQueueTokens
    });

    return res.json({
      message: `Token ${token.token_number} moved up to position #${targetPos}`,
      tokens: updatedQueueTokens
    });
  } catch (err) {
    console.error('Error moving token up:', err);
    return res.status(500).json({ error: 'Failed to move token up' });
  }
});

// POST /api/tokens/:id/move-down (Move token DOWN in queue - Req 5)
router.post('/:id/move-down', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Only waiting tokens can be moved in the queue' });
    }

    // Find max position
    const maxPosRow = db.prepare(`
      SELECT MAX(position) as max_pos FROM tokens WHERE queue_id = ? AND status = 'WAITING'
    `).get(token.queue_id);

    if (token.position >= maxPosRow.max_pos) {
      return res.status(400).json({ error: 'Token is already at the end of the queue' });
    }

    const currentPos = token.position;
    const targetPos = currentPos + 1;

    // Find successor token currently at targetPos
    const successor = db.prepare(`
      SELECT * FROM tokens 
      WHERE queue_id = ? AND status = 'WAITING' AND position = ?
    `).get(token.queue_id, targetPos);

    if (!successor) {
      db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(targetPos, tokenId);
    } else {
      runTransaction(() => {
        db.prepare('UPDATE tokens SET position = -1 WHERE id = ?').run(token.id);
        db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(currentPos, successor.id);
        db.prepare('UPDATE tokens SET position = ? WHERE id = ?').run(targetPos, token.id);
      });
    }

    const updatedQueueTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(token.queue_id);

    broadcastQueueUpdate({
      type: 'QUEUE_REORDERED',
      queueId: token.queue_id,
      tokens: updatedQueueTokens
    });

    return res.json({
      message: `Token ${token.token_number} moved down to position #${targetPos}`,
      tokens: updatedQueueTokens
    });
  } catch (err) {
    console.error('Error moving token down:', err);
    return res.status(500).json({ error: 'Failed to move token down' });
  }
});

// POST /api/tokens/:id/move-top (Move directly to position #1)
router.post('/:id/move-top', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    if (!token || token.status !== 'WAITING') {
      return res.status(400).json({ error: 'Valid waiting token required' });
    }

    if (token.position === 1) {
      return res.json({ message: 'Token is already at position #1' });
    }

    runTransaction(() => {
      // Increment position of tokens with position < currentPos
      db.prepare(`
        UPDATE tokens 
        SET position = position + 1 
        WHERE queue_id = ? AND status = 'WAITING' AND position < ?
      `).run(token.queue_id, token.position);

      db.prepare('UPDATE tokens SET position = 1 WHERE id = ?').run(token.id);
    });

    const updatedQueueTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(token.queue_id);

    broadcastQueueUpdate({
      type: 'QUEUE_REORDERED',
      queueId: token.queue_id,
      tokens: updatedQueueTokens
    });

    return res.json({
      message: `Token ${token.token_number} promoted to #1 in queue`,
      tokens: updatedQueueTokens
    });
  } catch (err) {
    console.error('Error moving token to top:', err);
    return res.status(500).json({ error: 'Failed to move token to top' });
  }
});

// PUT /api/tokens/reorder (Bulk reorder for drag & drop support)
router.put('/reorder', authenticateToken, (req, res) => {
  try {
    const { queue_id, orderedTokenIds } = req.body;

    if (!queue_id || !Array.isArray(orderedTokenIds) || orderedTokenIds.length === 0) {
      return res.status(400).json({ error: 'queue_id and orderedTokenIds array are required' });
    }

    runTransaction(() => {
      orderedTokenIds.forEach((id, index) => {
        db.prepare(`
          UPDATE tokens 
          SET position = ? 
          WHERE id = ? AND queue_id = ? AND status = 'WAITING'
        `).run(index + 1, Number(id), Number(queue_id));
      });
    });

    const updatedQueueTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(Number(queue_id));

    broadcastQueueUpdate({
      type: 'QUEUE_REORDERED',
      queueId: Number(queue_id),
      tokens: updatedQueueTokens
    });

    return res.json({
      message: 'Queue reordered successfully',
      tokens: updatedQueueTokens
    });
  } catch (err) {
    console.error('Error reordering tokens:', err);
    return res.status(500).json({ error: 'Failed to reorder tokens' });
  }
});

// POST /api/queues/:queueId/serve-top (Assign top token for service with 1 click - Req 6)
router.post('/serve-top/:queueId', authenticateToken, (req, res) => {
  try {
    const queueId = Number(req.params.queueId);
    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Check if there is already an active token IN_SERVICE for this queue
    const currentInService = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'IN_SERVICE'
    `).get(queueId);

    const servedToken = runTransaction(() => {
      // If there was an in-service token, auto-complete it before serving next
      if (currentInService) {
        db.prepare(`
          UPDATE tokens 
          SET status = 'COMPLETED', completed_at = (datetime('now', 'localtime'))
          WHERE id = ?
        `).run(currentInService.id);

        db.prepare(`
          INSERT INTO queue_events (queue_id, token_id, event_type, details)
          VALUES (?, ?, 'TOKEN_COMPLETED', ?)
        `).run(queueId, currentInService.id, `Previous token ${currentInService.token_number} marked completed`);
      }

      // Find top token (position = 1 or smallest position)
      const topToken = db.prepare(`
        SELECT * FROM tokens 
        WHERE queue_id = ? AND status = 'WAITING' 
        ORDER BY position ASC LIMIT 1
      `).get(queueId);

      if (!topToken) {
        throw new Error('NO_WAITING_TOKENS');
      }

      // Mark as IN_SERVICE
      db.prepare(`
        UPDATE tokens 
        SET 
          status = 'IN_SERVICE', 
          served_at = (datetime('now', 'localtime')),
          position = NULL,
          served_by = ?
        WHERE id = ?
      `).run(req.manager.id, topToken.id);

      // Recalibrate remaining waiting tokens: decrement position by 1
      db.prepare(`
        UPDATE tokens 
        SET position = position - 1 
        WHERE queue_id = ? AND status = 'WAITING'
      `).run(queueId);

      db.prepare(`
        INSERT INTO queue_events (queue_id, token_id, event_type, details)
        VALUES (?, ?, 'TOKEN_SERVED', ?)
      `).run(queueId, topToken.id, `Token ${topToken.token_number} assigned to ${queue.counter_name}`);

      return db.prepare(`
        SELECT t.*, q.name as queue_name, q.counter_name 
        FROM tokens t JOIN queues q ON t.queue_id = q.id 
        WHERE t.id = ?
      `).get(topToken.id);
    });

    const waitingTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(queueId);

    broadcastQueueUpdate({
      type: 'TOKEN_SERVED',
      queueId,
      servedToken,
      waitingTokens,
      announcement: {
        tokenNumber: servedToken.token_number,
        customerName: servedToken.customer_name,
        counterName: servedToken.counter_name || 'Counter 1',
        queueName: queue.name
      }
    });

    return res.json({
      message: `Token ${servedToken.token_number} assigned for service at ${servedToken.counter_name}`,
      servedToken,
      waitingTokens
    });
  } catch (err) {
    if (err.message === 'NO_WAITING_TOKENS') {
      return res.status(400).json({ error: 'No tokens waiting in this queue to serve' });
    }
    console.error('Error serving top token:', err);
    return res.status(500).json({ error: 'Failed to assign token for service' });
  }
});

// POST /api/tokens/:id/complete (Complete active in-service token)
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({ error: 'Only in-service tokens can be marked as completed' });
    }

    db.prepare(`
      UPDATE tokens 
      SET status = 'COMPLETED', completed_at = (datetime('now', 'localtime'))
      WHERE id = ?
    `).run(tokenId);

    db.prepare(`
      INSERT INTO queue_events (queue_id, token_id, event_type, details)
      VALUES (?, ?, 'TOKEN_COMPLETED', ?)
    `).run(token.queue_id, tokenId, `Token ${token.token_number} service completed`);

    const updatedToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    broadcastQueueUpdate({
      type: 'TOKEN_COMPLETED',
      queueId: token.queue_id,
      token: updatedToken
    });

    return res.json({
      message: `Service for Token ${token.token_number} completed`,
      token: updatedToken
    });
  } catch (err) {
    console.error('Error completing token service:', err);
    return res.status(500).json({ error: 'Failed to complete token' });
  }
});

// POST /api/tokens/:id/cancel (Cancel token from queue - Req 7)
router.post('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const { reason } = req.body;
    const cancelReason = reason && reason.trim() ? reason.trim() : 'Customer No-Show / Cancelled';

    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(token.status)) {
      return res.status(400).json({ error: `Cannot cancel a token that is already ${token.status}` });
    }

    const oldPos = token.position;

    runTransaction(() => {
      // Mark as cancelled
      db.prepare(`
        UPDATE tokens 
        SET 
          status = 'CANCELLED',
          cancellation_reason = ?,
          cancelled_at = (datetime('now', 'localtime')),
          position = NULL
        WHERE id = ?
      `).run(cancelReason, tokenId);

      // If it was waiting, decrement all subsequent waiting tokens in this queue
      if (oldPos !== null && oldPos !== undefined) {
        db.prepare(`
          UPDATE tokens 
          SET position = position - 1 
          WHERE queue_id = ? AND status = 'WAITING' AND position > ?
        `).run(token.queue_id, oldPos);
      }

      db.prepare(`
        INSERT INTO queue_events (queue_id, token_id, event_type, details)
        VALUES (?, ?, 'TOKEN_CANCELLED', ?)
      `).run(token.queue_id, tokenId, `Token ${token.token_number} cancelled: ${cancelReason}`);
    });

    const updatedQueueTokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC
    `).all(token.queue_id);

    broadcastQueueUpdate({
      type: 'TOKEN_CANCELLED',
      queueId: token.queue_id,
      tokenId: token.id,
      tokens: updatedQueueTokens,
      reason: cancelReason
    });

    return res.json({
      message: `Token ${token.token_number} cancelled (${cancelReason})`,
      cancelledTokenId: tokenId,
      waitingTokens: updatedQueueTokens
    });
  } catch (err) {
    console.error('Error cancelling token:', err);
    return res.status(500).json({ error: 'Failed to cancel token' });
  }
});

module.exports = router;
