const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../queue.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign key constraints for performance & integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'manager',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS queues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      description TEXT,
      counter_name TEXT DEFAULT 'Counter 1',
      is_active INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES managers(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id INTEGER NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
      token_number TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_email TEXT,
      priority TEXT DEFAULT 'standard',
      notes TEXT,
      position INTEGER,
      status TEXT DEFAULT 'WAITING',
      cancellation_reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      served_at TEXT,
      completed_at TEXT,
      cancelled_at TEXT,
      served_by INTEGER REFERENCES managers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS queue_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id INTEGER REFERENCES queues(id) ON DELETE CASCADE,
      token_id INTEGER REFERENCES tokens(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
    CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(queue_id, position);
    CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);
  `);
}

function runTransaction(callback) {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = callback(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedDefaultData() {
  const managerCount = db.prepare('SELECT COUNT(*) as count FROM managers').get().count;
  if (managerCount > 0) return;

  console.log('🌱 Seeding initial demo manager and sample queues...');
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('admin123', salt);

  runTransaction(() => {
    const insertManager = db.prepare(`
      INSERT INTO managers (username, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    const managerRes = insertManager.run('admin', 'manager@qflow.com', passwordHash, 'Sarah Jenkins', 'manager');
    const managerId = managerRes.lastInsertRowid;

    // Seed 3 realistic queues
    const insertQueue = db.prepare(`
      INSERT INTO queues (name, prefix, description, counter_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const q1 = insertQueue.run('Express Checkout & Billing', 'BILL', 'Quick billing and invoice payments (< 5 items)', 'Billing Counter 1', managerId);
    const q2 = insertQueue.run('Customer Service & Returns', 'SRV', 'Item exchanges, warranty claims, and account inquiries', 'Service Desk 2', managerId);
    const q3 = insertQueue.run('Priority Consultation & VIP', 'VIP', 'Dedicated advisory and high-value customer service', 'Executive Suite A', managerId);

    // Seed historical completed tokens for realistic analytics
    const insertToken = db.prepare(`
      INSERT INTO tokens (
        queue_id, token_number, sequence_number, customer_name, customer_phone, customer_email,
        priority, notes, position, status, cancellation_reason, created_at, served_at, completed_at, cancelled_at, served_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Completed tokens in the past few hours
    const completedSample = [
      { q: q1.lastInsertRowid, num: 'BILL-001', seq: 1, name: 'Emma Watson', phone: '+1-555-0101', prio: 'standard', created: '2026-11-13 09:15:00', served: '2026-11-13 09:20:00', done: '2026-11-13 09:25:30' },
      { q: q1.lastInsertRowid, num: 'BILL-002', seq: 2, name: 'David Miller', phone: '+1-555-0102', prio: 'standard', created: '2026-11-13 09:18:00', served: '2026-11-13 09:26:00', done: '2026-11-13 09:32:10' },
      { q: q1.lastInsertRowid, num: 'BILL-003', seq: 3, name: 'Grace Hopper', phone: '+1-555-0103', prio: 'vip', created: '2026-11-13 09:25:00', served: '2026-11-13 09:33:00', done: '2026-11-13 09:39:45' },
      { q: q2.lastInsertRowid, num: 'SRV-001', seq: 1, name: 'Carlos Rodriguez', phone: '+1-555-0201', prio: 'standard', created: '2026-11-13 09:30:00', served: '2026-11-13 09:42:00', done: '2026-11-13 09:55:00' },
      { q: q2.lastInsertRowid, num: 'SRV-002', seq: 2, name: 'Sophia Chen', phone: '+1-555-0202', prio: 'priority', created: '2026-11-13 09:45:00', served: '2026-11-13 09:56:00', done: '2026-11-13 10:11:00' },
      { q: q3.lastInsertRowid, num: 'VIP-001', seq: 1, name: 'Alexander Wright', phone: '+1-555-0301', prio: 'vip', created: '2026-11-13 10:00:00', served: '2026-11-13 10:05:00', done: '2026-11-13 10:24:00' },
    ];

    completedSample.forEach(c => {
      insertToken.run(
        c.q, c.num, c.seq, c.name, c.phone, `${c.name.toLowerCase().replace(' ', '.')}@example.com`,
        c.prio, 'Completed transaction', null, 'COMPLETED', null, c.created, c.served, c.done, null, managerId
      );
    });

    // One cancelled token
    insertToken.run(
      q1.lastInsertRowid, 'BILL-004', 4, 'Robert Johnson', '+1-555-0104', 'robert@example.com',
      'standard', 'Customer departed early', null, 'CANCELLED', 'Customer No-Show',
      '2026-11-13 09:40:00', null, null, '2026-11-13 09:55:00', null
    );

    // One active token currently IN_SERVICE for Queue 1
    insertToken.run(
      q1.lastInsertRowid, 'BILL-005', 5, 'Liam Gallagher', '+1-555-0105', 'liam@example.com',
      'standard', 'Processing payment', null, 'IN_SERVICE', null,
      '2026-11-13 10:10:00', '2026-11-13 10:20:00', null, null, managerId
    );

    // Active WAITING tokens for Queue 1 (Ordered positions 1, 2, 3, 4)
    const waitingQ1 = [
      { name: 'Lucas Scott', phone: '+1-555-0106', prio: 'standard', notes: 'Invoice check' },
      { name: 'Amelia Earhart', phone: '+1-555-0107', prio: 'vip', notes: 'VIP account' },
      { name: 'Marcus Aurelius', phone: '+1-555-0108', prio: 'priority', notes: 'Senior citizen' },
      { name: 'Hannah Abbott', phone: '+1-555-0109', prio: 'standard', notes: 'Return item' },
    ];

    waitingQ1.forEach((w, idx) => {
      insertToken.run(
        q1.lastInsertRowid, `BILL-00${6 + idx}`, 6 + idx, w.name, w.phone, `${w.name.toLowerCase().replace(' ', '.')}@example.com`,
        w.prio, w.notes, idx + 1, 'WAITING', null,
        new Date(Date.now() - (waitingQ1.length - idx) * 3 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        null, null, null, null
      );
    });

    // Active WAITING tokens for Queue 2
    const waitingQ2 = [
      { name: 'Nathan Drake', phone: '+1-555-0203', prio: 'standard', notes: 'Warranty check' },
      { name: 'Elena Fisher', phone: '+1-555-0204', prio: 'priority', notes: 'Defective unit' },
    ];

    waitingQ2.forEach((w, idx) => {
      insertToken.run(
        q2.lastInsertRowid, `SRV-00${3 + idx}`, 3 + idx, w.name, w.phone, `${w.name.toLowerCase().replace(' ', '.')}@example.com`,
        w.prio, w.notes, idx + 1, 'WAITING', null,
        new Date(Date.now() - (waitingQ2.length - idx) * 5 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        null, null, null, null
      );
    });
  });

  console.log('✅ Sample data seeded successfully.');
}

// Reset & reseed helper for testing or demo reset
function resetAndSeedDemo() {
  runTransaction(() => {
    db.exec(`
      DELETE FROM queue_events;
      DELETE FROM tokens;
      DELETE FROM queues;
      DELETE FROM managers;
    `);
  });
  seedDefaultData();
  return { success: true, message: 'Database reset and sample data re-seeded' };
}

// Initialize on module load
initSchema();
seedDefaultData();

module.exports = {
  db,
  runTransaction,
  resetAndSeedDemo
};
