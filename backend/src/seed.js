// Dummy seed data — replace by entering real data through the app.
import { db } from './db.js';

const insertPerson = db.prepare('INSERT INTO people (name, notes) VALUES (?, ?)');
const insertTx = db.prepare(
  'INSERT INTO transactions (person_id, type, amount, date, note) VALUES (?, ?, ?, ?, ?)'
);

const existing = db.prepare('SELECT COUNT(*) AS c FROM people').get().c;
if (existing > 0) {
  console.log('Seed skipped: people already exist in the database.');
  process.exit(0);
}

const alice = insertPerson.run('Alice (example)', 'Sample/demo entry').lastInsertRowid;
insertTx.run(alice, 'GIVEN', 50000, '2024-01-10', 'Example: cash given');
insertTx.run(alice, 'REPAID', 20000, '2024-03-15', 'Example: partial repayment');

const bob = insertPerson.run('Bob (example)', 'Sample/demo entry').lastInsertRowid;
insertTx.run(bob, 'GIVEN', 15000, '2024-02-01', 'Example: UPI transfer');

console.log('Seeded 2 example people with sample transactions.');
