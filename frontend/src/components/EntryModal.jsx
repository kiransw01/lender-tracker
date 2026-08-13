import { useEffect, useState } from 'react';
import { financeApi } from '../financeApi.js';

const CATEGORY_SUGGESTIONS = {
  INCOME: ['Salary', 'Business', 'Interest', 'Gift', 'Other'],
  EXPENSE: ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
};

export default function EntryModal({ entry, onClose, onSaved }) {
  const isEdit = Boolean(entry);
  const [type, setType] = useState(entry?.type || 'EXPENSE');
  const [amount, setAmount] = useState(entry?.amount ?? '');
  const [category, setCategory] = useState(entry?.category || '');
  const [date, setDate] = useState(entry?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(entry?.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { type, amount: numAmount, category, date: date || null, note };
      const result = isEdit
        ? await financeApi.updateEntry(entry.id, payload)
        : await financeApi.addEntry(payload);
      onSaved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit entry' : 'Add entry'}</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={type === 'INCOME' ? 'active-repaid' : ''}
                onClick={() => setType('INCOME')}
              >
                Income
              </button>
              <button
                type="button"
                className={type === 'EXPENSE' ? 'active-given' : ''}
                onClick={() => setType('EXPENSE')}
              >
                Expense
              </button>
            </div>
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2500"
            />
          </div>
          <div className="field">
            <label>Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Food, Salary, Rent"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS[type].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>Date (optional)</label>
            <div className="date-input">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date && (
                <button type="button" className="date-clear" onClick={() => setDate('')}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="field">
            <label>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. groceries" />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
