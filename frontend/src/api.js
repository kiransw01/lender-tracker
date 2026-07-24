// Firestore-backed storage API — one document per username, holding the full
// { people, transactions, nextPersonId, nextTxId, salt, passwordHash } shape.
// Auth (auth.js) manages salt/passwordHash; this module manages the app data
// fields within the same document.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, ensureFirebaseSignedIn } from './firebase.js';
import { auth } from './auth.js';

function userDocRef(username) {
  return doc(db, 'users', username);
}

async function loadStore() {
  await ensureFirebaseSignedIn();
  const username = auth.getUsername();
  if (!username) throw new Error('Not signed in');

  const ref = userDocRef(username);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Account not found');
  return snap.data();
}

async function saveStore(store) {
  const username = auth.getUsername();
  if (!username) throw new Error('Not signed in');
  await setDoc(userDocRef(username), store);
}

function withBalance(person, store) {
  const txs = store.transactions.filter((t) => t.person_id === person.id);
  const totalGiven = txs.filter((t) => t.type === 'GIVEN').reduce((s, t) => s + t.amount, 0);
  const totalRepaid = txs.filter((t) => t.type === 'REPAID').reduce((s, t) => s + t.amount, 0);
  return { ...person, totalGiven, totalRepaid, balance: totalGiven - totalRepaid };
}

export const api = {
  async getPeople() {
    const store = await loadStore();
    return store.people
      .map((p) => withBalance(p, store))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getPerson(id) {
    const store = await loadStore();
    const person = store.people.find((p) => String(p.id) === String(id));
    if (!person) throw new Error('Person not found');
    const transactions = store.transactions
      .filter((t) => String(t.person_id) === String(id))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
    return { ...withBalance(person, store), transactions };
  },

  async createPerson({ name, notes }) {
    if (!name || !name.trim()) throw new Error('name is required');
    const store = await loadStore();
    const person = {
      id: store.nextPersonId,
      name: name.trim(),
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    store.people.push(person);
    store.nextPersonId += 1;
    await saveStore(store);
    return withBalance(person, store);
  },

  async updatePerson(id, { name, notes }) {
    const store = await loadStore();
    const person = store.people.find((p) => String(p.id) === String(id));
    if (!person) throw new Error('Person not found');
    if (name && name.trim()) person.name = name.trim();
    if (notes !== undefined) person.notes = notes;
    await saveStore(store);
    return withBalance(person, store);
  },

  async deletePerson(id) {
    const store = await loadStore();
    store.people = store.people.filter((p) => String(p.id) !== String(id));
    store.transactions = store.transactions.filter((t) => String(t.person_id) !== String(id));
    await saveStore(store);
    return null;
  },

  async addTransaction(personId, { type, amount, date, note }) {
    if (!['GIVEN', 'REPAID'].includes(type)) throw new Error("type must be 'GIVEN' or 'REPAID'");
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) throw new Error('amount must be a positive number');
    const store = await loadStore();
    const person = store.people.find((p) => String(p.id) === String(personId));
    if (!person) throw new Error('Person not found');
    const tx = {
      id: store.nextTxId,
      person_id: person.id,
      type,
      amount: numAmount,
      date: date || new Date().toISOString().slice(0, 10),
      note: note || null,
      created_at: new Date().toISOString(),
    };
    store.transactions.push(tx);
    store.nextTxId += 1;
    await saveStore(store);
    return tx;
  },

  async updateTransaction(id, { type, amount, date, note }) {
    const store = await loadStore();
    const tx = store.transactions.find((t) => String(t.id) === String(id));
    if (!tx) throw new Error('Transaction not found');
    if (type) tx.type = type;
    if (amount) tx.amount = Number(amount);
    if (date) tx.date = date;
    if (note !== undefined) tx.note = note;
    await saveStore(store);
    return tx;
  },

  async deleteTransaction(id) {
    const store = await loadStore();
    store.transactions = store.transactions.filter((t) => String(t.id) !== String(id));
    await saveStore(store);
    return null;
  },

  async getSummary() {
    const store = await loadStore();
    const people = store.people.map((p) => withBalance(p, store));
    const totalGiven = people.reduce((s, p) => s + p.totalGiven, 0);
    const totalRepaid = people.reduce((s, p) => s + p.totalRepaid, 0);
    const totalOutstanding = people.reduce((s, p) => s + p.balance, 0);
    return { totalGiven, totalRepaid, totalOutstanding, peopleCount: people.length };
  },

  // --- Backup helpers (export/import) ---
  async exportData() {
    const store = await loadStore();
    const { salt, passwordHash, ...appData } = store;
    return JSON.stringify(appData, null, 2);
  },

  async importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.people || !parsed.transactions) throw new Error('Invalid backup file');
    const store = await loadStore();
    await saveStore({ ...store, ...parsed });
  },
};
