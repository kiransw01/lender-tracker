// Local-first storage API — everything lives in the browser's localStorage.
// No backend/server needed. Data never leaves the device unless you export it.
//
// Same function names/shapes as the old REST-based api.js, so all
// components/pages work unchanged.

const STORE_KEY = 'lender-tracker-data-v1';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { people: [], transactions: [], nextPersonId: 1, nextTxId: 1 };
    return JSON.parse(raw);
  } catch {
    return { people: [], transactions: [], nextPersonId: 1, nextTxId: 1 };
  }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function withBalance(person, store) {
  const txs = store.transactions.filter((t) => t.person_id === person.id);
  const totalGiven = txs.filter((t) => t.type === 'GIVEN').reduce((s, t) => s + t.amount, 0);
  const totalRepaid = txs.filter((t) => t.type === 'REPAID').reduce((s, t) => s + t.amount, 0);
  return { ...person, totalGiven, totalRepaid, balance: totalGiven - totalRepaid };
}

function delay() {
  // keep the same async shape as the old fetch-based API
  return Promise.resolve();
}

export const api = {
  async getPeople() {
    await delay();
    const store = loadStore();
    return store.people
      .map((p) => withBalance(p, store))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getPerson(id) {
    await delay();
    const store = loadStore();
    const person = store.people.find((p) => String(p.id) === String(id));
    if (!person) throw new Error('Person not found');
    const transactions = store.transactions
      .filter((t) => String(t.person_id) === String(id))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
    return { ...withBalance(person, store), transactions };
  },

  async createPerson({ name, notes }) {
    await delay();
    if (!name || !name.trim()) throw new Error('name is required');
    const store = loadStore();
    const person = {
      id: store.nextPersonId,
      name: name.trim(),
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    store.people.push(person);
    store.nextPersonId += 1;
    saveStore(store);
    return withBalance(person, store);
  },

  async updatePerson(id, { name, notes }) {
    await delay();
    const store = loadStore();
    const person = store.people.find((p) => String(p.id) === String(id));
    if (!person) throw new Error('Person not found');
    if (name && name.trim()) person.name = name.trim();
    if (notes !== undefined) person.notes = notes;
    saveStore(store);
    return withBalance(person, store);
  },

  async deletePerson(id) {
    await delay();
    const store = loadStore();
    store.people = store.people.filter((p) => String(p.id) !== String(id));
    store.transactions = store.transactions.filter((t) => String(t.person_id) !== String(id));
    saveStore(store);
    return null;
  },

  async addTransaction(personId, { type, amount, date, note }) {
    await delay();
    if (!['GIVEN', 'REPAID'].includes(type)) throw new Error("type must be 'GIVEN' or 'REPAID'");
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) throw new Error('amount must be a positive number');
    const store = loadStore();
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
    saveStore(store);
    return tx;
  },

  async updateTransaction(id, { type, amount, date, note }) {
    await delay();
    const store = loadStore();
    const tx = store.transactions.find((t) => String(t.id) === String(id));
    if (!tx) throw new Error('Transaction not found');
    if (type) tx.type = type;
    if (amount) tx.amount = Number(amount);
    if (date) tx.date = date;
    if (note !== undefined) tx.note = note;
    saveStore(store);
    return tx;
  },

  async deleteTransaction(id) {
    await delay();
    const store = loadStore();
    store.transactions = store.transactions.filter((t) => String(t.id) !== String(id));
    saveStore(store);
    return null;
  },

  async getSummary() {
    await delay();
    const store = loadStore();
    const people = store.people.map((p) => withBalance(p, store));
    const totalGiven = people.reduce((s, p) => s + p.totalGiven, 0);
    const totalRepaid = people.reduce((s, p) => s + p.totalRepaid, 0);
    const totalOutstanding = people.reduce((s, p) => s + p.balance, 0);
    return { totalGiven, totalRepaid, totalOutstanding, peopleCount: people.length };
  },

  // --- Backup helpers (export/import) ---
  exportData() {
    const store = loadStore();
    return JSON.stringify(store, null, 2);
  },

  importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.people || !parsed.transactions) throw new Error('Invalid backup file');
    saveStore(parsed);
  },
};
