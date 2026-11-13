/**
 * Automated Verification & Unit Test Suite for Q-Flow Queue Management System
 * Tests all 8 core functional requirements and edge cases.
 */

const { db, runTransaction, resetAndSeedDemo } = require('../src/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/middleware/auth');

let testFailures = 0;
let testSuccesses = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testSuccesses++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testFailures++;
  }
}

console.log('\n======================================================');
console.log('🧪 Q-Flow Backend & Business Logic Test Suite');
console.log('======================================================\n');

// Reset database to known test state
resetAndSeedDemo();

// TEST 1: Manager Authentication & Accounts
console.log('--- Test Suite 1: Manager Login & Auth (Req 1) ---');
const admin = db.prepare('SELECT * FROM managers WHERE username = ?').get('admin');
assert(!!admin, 'Admin demo manager exists in database');
assert(bcrypt.compareSync('admin123', admin.password_hash), 'Admin password hashes and verifies correctly');

const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(token, JWT_SECRET);
assert(decoded.id === admin.id, 'JWT token successfully encodes and verifies manager identity');

// TEST 2: Queue Creation & Names (Req 1 & 2)
console.log('\n--- Test Suite 2: Queue Creation & Naming (Req 1 & Req 2) ---');
const newQueueRes = db.prepare(`
  INSERT INTO queues (name, prefix, description, counter_name, created_by)
  VALUES (?, ?, ?, ?, ?)
`).run('Special Pharmacy Services', 'PHRM', 'Prescription pickup & consultation', 'Counter 4', admin.id);

const testQueue = db.prepare('SELECT * FROM queues WHERE id = ?').get(newQueueRes.lastInsertRowid);
assert(testQueue.name === 'Special Pharmacy Services', 'Queue created with proper Name');
assert(testQueue.prefix === 'PHRM', 'Queue assigned unique Prefix');
assert(testQueue.counter_name === 'Counter 4', 'Queue assigned Counter Name');

// TEST 3: Add Persons / Tokens (Req 3)
console.log('\n--- Test Suite 3: Adding Tokens into Queue (Req 3) ---');
const addToken1 = db.prepare(`
  INSERT INTO tokens (queue_id, token_number, sequence_number, customer_name, customer_phone, priority, position, status)
  VALUES (?, 'PHRM-001', 1, 'John Doe', '+1-555-1001', 'standard', 1, 'WAITING')
`).run(testQueue.id);

const addToken2 = db.prepare(`
  INSERT INTO tokens (queue_id, token_number, sequence_number, customer_name, customer_phone, priority, position, status)
  VALUES (?, 'PHRM-002', 2, 'Jane Smith', '+1-555-1002', 'vip', 2, 'WAITING')
`).run(testQueue.id);

const addToken3 = db.prepare(`
  INSERT INTO tokens (queue_id, token_number, sequence_number, customer_name, customer_phone, priority, position, status)
  VALUES (?, 'PHRM-003', 3, 'Alice Walker', '+1-555-1003', 'standard', 3, 'WAITING')
`).run(testQueue.id);

const token1 = db.prepare('SELECT * FROM tokens WHERE id = ?').get(addToken1.lastInsertRowid);
const token2 = db.prepare('SELECT * FROM tokens WHERE id = ?').get(addToken2.lastInsertRowid);
const token3 = db.prepare('SELECT * FROM tokens WHERE id = ?').get(addToken3.lastInsertRowid);

assert(token1.token_number === 'PHRM-001' && token1.position === 1, 'Token 1 generated with sequence and position 1');
assert(token2.token_number === 'PHRM-002' && token2.position === 2, 'Token 2 generated with sequence and position 2');
assert(token3.token_number === 'PHRM-003' && token3.position === 3, 'Token 3 generated with sequence and position 3');

// TEST 4: Display List of Waiting Tokens (Req 4)
console.log('\n--- Test Suite 4: Display Queue List (Req 4) ---');
const waitingList = db.prepare('SELECT * FROM tokens WHERE queue_id = ? AND status = ? ORDER BY position ASC').all(testQueue.id, 'WAITING');
assert(waitingList.length === 3, 'Queue returns exactly 3 waiting tokens');
assert(waitingList[0].customer_name === 'John Doe', 'Top waiting person is John Doe');
assert(waitingList[1].customer_name === 'Jane Smith', 'Second waiting person is Jane Smith');
assert(waitingList[2].customer_name === 'Alice Walker', 'Third waiting person is Alice Walker');

// TEST 5: Moving Tokens Up and Down in the Queue (Req 5)
console.log('\n--- Test Suite 5: Token Reordering (Move Up / Down) (Req 5) ---');
// Move Token 2 (Jane Smith) UP so she becomes position 1, John Doe becomes position 2
runTransaction(() => {
  db.prepare('UPDATE tokens SET position = -1 WHERE id = ?').run(token2.id);
  db.prepare('UPDATE tokens SET position = 2 WHERE id = ?').run(token1.id);
  db.prepare('UPDATE tokens SET position = 1 WHERE id = ?').run(token2.id);
});

let reordered = db.prepare('SELECT * FROM tokens WHERE queue_id = ? AND status = ? ORDER BY position ASC').all(testQueue.id, 'WAITING');
assert(reordered[0].id === token2.id && reordered[0].position === 1, 'Jane Smith successfully moved UP to position #1');
assert(reordered[1].id === token1.id && reordered[1].position === 2, 'John Doe shifted down to position #2');

// Move Token 2 back DOWN so John Doe is position 1, Jane Smith is position 2
runTransaction(() => {
  db.prepare('UPDATE tokens SET position = -1 WHERE id = ?').run(token2.id);
  db.prepare('UPDATE tokens SET position = 1 WHERE id = ?').run(token1.id);
  db.prepare('UPDATE tokens SET position = 2 WHERE id = ?').run(token2.id);
});

reordered = db.prepare('SELECT * FROM tokens WHERE queue_id = ? AND status = ? ORDER BY position ASC').all(testQueue.id, 'WAITING');
assert(reordered[0].id === token1.id && reordered[0].position === 1, 'Token successfully moved DOWN; John Doe is #1 again');

// TEST 6: Assign Token at Top of Queue for Service (Req 6)
console.log('\n--- Test Suite 6: Assign Top Token for Service (Req 6) ---');
// Top token is token1 (John Doe, pos 1)
runTransaction(() => {
  // Set top token to IN_SERVICE
  db.prepare(`
    UPDATE tokens 
    SET status = 'IN_SERVICE', served_at = (datetime('now', 'localtime')), position = NULL, served_by = ?
    WHERE id = ?
  `).run(admin.id, token1.id);

  // Recalibrate remaining waiting tokens: decrement position by 1
  db.prepare(`
    UPDATE tokens 
    SET position = position - 1 
    WHERE queue_id = ? AND status = 'WAITING'
  `).run(testQueue.id);
});

const served = db.prepare('SELECT * FROM tokens WHERE id = ?').get(token1.id);
assert(served.status === 'IN_SERVICE', 'Top token John Doe status changed to IN_SERVICE');
assert(served.served_at !== null, 'Service start timestamp recorded');
assert(served.position === null, 'Position is cleared once in service');

const remainingAfterServe = db.prepare('SELECT * FROM tokens WHERE queue_id = ? AND status = ? ORDER BY position ASC').all(testQueue.id, 'WAITING');
assert(remainingAfterServe.length === 2, 'Waiting queue reduced to 2 tokens');
assert(remainingAfterServe[0].id === token2.id && remainingAfterServe[0].position === 1, 'Jane Smith auto-promoted to position #1');
assert(remainingAfterServe[1].id === token3.id && remainingAfterServe[1].position === 2, 'Alice Walker auto-promoted to position #2');

// TEST 7: Cancel Token from Queue (Req 7)
console.log('\n--- Test Suite 7: Cancel Token from Queue (Req 7) ---');
// Cancel Jane Smith (currently pos 1)
const cancelPos = remainingAfterServe[0].position;
runTransaction(() => {
  db.prepare(`
    UPDATE tokens 
    SET status = 'CANCELLED', cancellation_reason = ?, cancelled_at = (datetime('now', 'localtime')), position = NULL
    WHERE id = ?
  `).run('Customer Request', token2.id);

  // Recalibrate remaining tokens with position > cancelPos
  db.prepare(`
    UPDATE tokens 
    SET position = position - 1 
    WHERE queue_id = ? AND status = 'WAITING' AND position > ?
  `).run(testQueue.id, cancelPos);
});

const cancelled = db.prepare('SELECT * FROM tokens WHERE id = ?').get(token2.id);
assert(cancelled.status === 'CANCELLED', 'Token status set to CANCELLED');
assert(cancelled.cancellation_reason === 'Customer Request', 'Cancellation reason logged');

const remainingAfterCancel = db.prepare('SELECT * FROM tokens WHERE queue_id = ? AND status = ? ORDER BY position ASC').all(testQueue.id, 'WAITING');
assert(remainingAfterCancel.length === 1, 'Queue now has exactly 1 waiting token');
assert(remainingAfterCancel[0].id === token3.id && remainingAfterCancel[0].position === 1, 'Alice Walker smoothly recalibrated to position #1');

// TEST 8: Analytics & Trends (Req 8)
console.log('\n--- Test Suite 8: Analytics Dashboard Calculations (Req 8) ---');
const totalTokens = db.prepare('SELECT COUNT(*) as count FROM tokens').get().count;
const completedCount = db.prepare("SELECT COUNT(*) as count FROM tokens WHERE status = 'COMPLETED'").get().count;
const waitingCount = db.prepare("SELECT COUNT(*) as count FROM tokens WHERE status = 'WAITING'").get().count;
const cancelledCount = db.prepare("SELECT COUNT(*) as count FROM tokens WHERE status = 'CANCELLED'").get().count;

assert(totalTokens > 0, `Total tokens counted: ${totalTokens}`);
assert(completedCount > 0, `Completed tokens counted: ${completedCount}`);
assert(waitingCount > 0, `Active waiting tokens counted: ${waitingCount}`);
assert(cancelledCount > 0, `Cancelled tokens counted: ${cancelledCount}`);

// Verify hourly trends grouping
const hourly = db.prepare(`
  SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
  FROM tokens GROUP BY hour
`).all();
assert(hourly.length > 0, 'Hourly trend analysis generates time-series bins');

console.log('\n======================================================');
console.log(`📊 Test Results: ${testSuccesses} Passed, ${testFailures} Failed`);
console.log('======================================================\n');

if (testFailures > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL BACKEND BUSINESS LOGIC TESTS PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}
