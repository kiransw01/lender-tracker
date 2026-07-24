import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// --- helpers ---
function personWithBalance(person) {
  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'GIVEN' THEN amount ELSE 0 END), 0) AS given,
         COALESCE(SUM(CASE WHEN type = 'REPAID' THEN amount ELSE 0 END), 0) AS repaid
       FROM transactions WHERE person_id = ?`
    )
    .get(person.id);
  return {
    ...person,
    totalGiven: totals.given,
    totalRepaid: totals.repaid,
    balance: totals.given - totals.repaid,
  };
}

// --- People ---

app.get('/api/people', (req, res) => {
  const people = db.prepare('SELECT * FROM people ORDER BY name COLLATE NOCASE').all();
  res.json(people.map(personWithBalance));
});

app.get('/api/people/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  const transactions = db
    .prepare('SELECT * FROM transactions WHERE person_id = ? ORDER BY date DESC, id DESC')
    .all(person.id);
  res.json({ ...personWithBalance(person), transactions });
});

app.post('/api/people', (req, res) => {
  const { name, notes } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO people (name, notes) VALUES (?, ?)').run(name.trim(), notes || null);
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(personWithBalance(person));
});

app.put('/api/people/:id', (req, res) => {
  const { name, notes } = req.body;
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  db.prepare('UPDATE people SET name = ?, notes = ? WHERE id = ?').run(
    name?.trim() || person.name,
    notes ?? person.notes,
    person.id
  );
  const updated = db.prepare('SELECT * FROM people WHERE id = ?').get(person.id);
  res.json(personWithBalance(updated));
});

app.delete('/api/people/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  db.prepare('DELETE FROM people WHERE id = ?').run(person.id);
  res.status(204).end();
});

// --- Transactions ---

app.post('/api/people/:id/transactions', (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const { type, amount, date, note } = req.body;
  if (!['GIVEN', 'REPAID'].includes(type)) {
    return res.status(400).json({ error: "type must be 'GIVEN' or 'REPAID'" });
  }
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  const txDate = date || new Date().toISOString().slice(0, 10);

  const result = db
    .prepare('INSERT INTO transactions (person_id, type, amount, date, note) VALUES (?, ?, ?, ?, ?)')
    .run(person.id, type, numAmount, txDate, note || null);

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tx);
});

app.put('/api/transactions/:id', (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  const { type, amount, date, note } = req.body;
  db.prepare('UPDATE transactions SET type = ?, amount = ?, date = ?, note = ? WHERE id = ?').run(
    type || tx.type,
    amount ? Number(amount) : tx.amount,
    date || tx.date,
    note ?? tx.note,
    tx.id
  );
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(tx.id));
});

app.delete('/api/transactions/:id', (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
  res.status(204).end();
});

// --- Summary ---

app.get('/api/summary', (req, res) => {
  const people = db.prepare('SELECT * FROM people').all().map(personWithBalance);
  const totalOutstanding = people.reduce((sum, p) => sum + p.balance, 0);
  const totalGiven = people.reduce((sum, p) => sum + p.totalGiven, 0);
  const totalRepaid = people.reduce((sum, p) => sum + p.totalRepaid, 0);
  res.json({ totalOutstanding, totalGiven, totalRepaid, peopleCount: people.length });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Lender Tracker API running on http://localhost:${PORT}`);
});
