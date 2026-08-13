import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { financeApi } from '../financeApi.js';
import EntryModal from '../components/EntryModal.jsx';
import { formatCurrency, formatDate } from '../format.js';

export default function Finance() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntry, setEditingEntry] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL | INCOME | EXPENSE

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [entriesData, summaryData] = await Promise.all([
        financeApi.getEntries(),
        financeApi.getSummary(),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredEntries = useMemo(() => {
    if (filterType === 'ALL') return entries;
    return entries.filter((e) => e.type === filterType);
  }, [entries, filterType]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return;
    await financeApi.deleteEntry(id);
    load();
  }

  async function handleExport() {
    const data = await financeApi.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const balanceClass = summary && summary.balance < 0 ? 'positive' : 'zero';

  return (
    <>
      <Link to="/" className="back-link">← Back to Lender Tracker</Link>
      <header className="top">
        <div>
          <h1>Income &amp; Expenses</h1>
          <p className="header-greeting">Track what you earn and spend — separate from lending.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={handleExport}>Export</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {summary && (
        <div className="summary-card">
          <div className="summary-item">
            <div className="label">Income</div>
            <div className="value green">{formatCurrency(summary.totalIncome)}</div>
          </div>
          <div className="summary-item">
            <div className="label">Expenses</div>
            <div className="value red">{formatCurrency(summary.totalExpense)}</div>
          </div>
          <div className="summary-item">
            <div className="label">Balance</div>
            <div className={`value ${summary.balance < 0 ? 'red' : 'green'}`}>
              {formatCurrency(summary.balance)}
            </div>
          </div>
        </div>
      )}

      <div className="type-toggle finance-filter">
        <button className={filterType === 'ALL' ? 'active-repaid' : ''} onClick={() => setFilterType('ALL')}>
          All
        </button>
        <button className={filterType === 'INCOME' ? 'active-repaid' : ''} onClick={() => setFilterType('INCOME')}>
          Income
        </button>
        <button className={filterType === 'EXPENSE' ? 'active-given' : ''} onClick={() => setFilterType('EXPENSE')}>
          Expense
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state">No entries yet. Tap + to add income or an expense.</div>
      ) : (
        <div className="tx-list">
          {filteredEntries.map((entry) => (
            <div className="tx-row" key={entry.id}>
              <div className="tx-main">
                <span className={`tx-amount ${entry.type === 'EXPENSE' ? 'given' : 'repaid'}`}>
                  {entry.type === 'EXPENSE' ? '−' : '+'} {formatCurrency(entry.amount)}
                </span>
                {entry.category && <span className="tx-note">{entry.category}</span>}
                {entry.note && <span className="tx-note">{entry.note}</span>}
                <span className="tx-date">{formatDate(entry.date)}</span>
              </div>
              <div className="tx-row-actions">
                <button className="tx-edit" onClick={() => setEditingEntry(entry)}>Edit</button>
                <button className="tx-delete" onClick={() => handleDelete(entry.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add entry">+</button>

      {showAdd && (
        <EntryModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {editingEntry && (
        <EntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(false)}
          onSaved={() => {
            setEditingEntry(false);
            load();
          }}
        />
      )}
    </>
  );
}
