// Firestore-backed storage API for the standalone Income/Expense tracker.
// Deliberately kept separate from api.js (lending data) — different Firestore
// collection ("finance"), different document shape, no shared state.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, ensureFirebaseSignedIn } from './firebase.js';
import { auth } from './auth.js';

function financeDocRef(username) {
  return doc(db, 'finance', username);
}

function emptyStore() {
  return { entries: [], nextEntryId: 1 };
}

async function loadStore() {
  await ensureFirebaseSignedIn();
  const username = auth.getUsername();
  if (!username) throw new Error('Not signed in');

  const ref = financeDocRef(username);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const initial = emptyStore();
    await setDoc(ref, initial);
    return initial;
  }
  return snap.data();
}

async function saveStore(store) {
  const username = auth.getUsername();
  if (!username) throw new Error('Not signed in');
  await setDoc(financeDocRef(username), store);
}

function computeSummary(entries) {
  const totalIncome = entries.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

export const financeApi = {
  async getEntries() {
    const store = await loadStore();
    return store.entries.slice().sort((a, b) => {
      const aKey = a.date || a.created_at || '';
      const bKey = b.date || b.created_at || '';
      if (aKey !== bKey) return aKey < bKey ? 1 : -1;
      return b.id - a.id;
    });
  },

  async getSummary() {
    const store = await loadStore();
    return computeSummary(store.entries);
  },

  async addEntry({ type, amount, category, date, note }) {
    if (!['INCOME', 'EXPENSE'].includes(type)) throw new Error("type must be 'INCOME' or 'EXPENSE'");
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) throw new Error('amount must be a positive number');
    const store = await loadStore();
    const entry = {
      id: store.nextEntryId,
      type,
      amount: numAmount,
      category: category || null,
      date: date || null,
      note: note || null,
      created_at: new Date().toISOString(),
    };
    store.entries.push(entry);
    store.nextEntryId += 1;
    await saveStore(store);
    return entry;
  },

  async updateEntry(id, { type, amount, category, date, note }) {
    const store = await loadStore();
    const entry = store.entries.find((e) => String(e.id) === String(id));
    if (!entry) throw new Error('Entry not found');
    if (type) entry.type = type;
    if (amount) entry.amount = Number(amount);
    if (category !== undefined) entry.category = category || null;
    if (date !== undefined) entry.date = date || null;
    if (note !== undefined) entry.note = note || null;
    await saveStore(store);
    return entry;
  },

  async deleteEntry(id) {
    const store = await loadStore();
    store.entries = store.entries.filter((e) => String(e.id) !== String(id));
    await saveStore(store);
    return null;
  },

  // --- Backup helpers ---
  async exportData() {
    const store = await loadStore();
    return JSON.stringify(store, null, 2);
  },

  async importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.entries) throw new Error('Invalid backup file');
    await saveStore(parsed);
  },
};
