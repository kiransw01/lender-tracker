import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function TransactionModal({ personId, transaction, onClose, onSaved }) {
  const isEdit = Boolean(transaction);
  const [type, setType] = useState(transaction?.type || 'GIVEN');
  const [amount, setAmount] = useState(transaction?.amount ?? '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(transaction?.note || '');
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
      const payload = { type, amount: numAmount, date, note };
      const result = isEdit
        ? await api.updateTransaction(transaction.id, payload)
        : await api.addTransaction(personId, payload);
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
        <h3>{isEdit ? 'Edit transaction' : 'Add transaction'}</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={type === 'GIVEN' ? 'active-given' : ''}
                onClick={() => setType('GIVEN')}
              >
                Given
              </button>
              <button
                type="button"
                className={type === 'REPAID' ? 'active-repaid' : ''}
                onClick={() => setType('REPAID')}
              >
                Repaid
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
              placeholder="e.g. 50000"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. site registration" />
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
