import { useEffect, useState } from 'react';
import { api } from '../api.js';
import PersonCard from '../components/PersonCard.jsx';
import AddPersonModal from '../components/AddPersonModal.jsx';
import { formatCurrency } from '../format.js';

export default function PeopleList() {
  const [people, setPeople] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [peopleData, summaryData] = await Promise.all([api.getPeople(), api.getSummary()]);
      setPeople(peopleData);
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

  return (
    <>
      <header className="top">
        <h1>Lender Tracker</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {summary && (
        <div className="summary-card">
          <div className="summary-item">
            <div className="label">People</div>
            <div className="value">{summary.peopleCount}</div>
          </div>
          <div className="summary-item">
            <div className="label">Total Given</div>
            <div className="value">{formatCurrency(summary.totalGiven)}</div>
          </div>
          <div className="summary-item">
            <div className="label">Total Repaid</div>
            <div className="value green">{formatCurrency(summary.totalRepaid)}</div>
          </div>
          <div className="summary-item">
            <div className="label">Outstanding</div>
            <div className="value red">{formatCurrency(summary.totalOutstanding)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : people.length === 0 ? (
        <div className="empty-state">No people yet. Tap + to add someone.</div>
      ) : (
        <div className="person-list">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add person">+</button>

      {showAdd && (
        <AddPersonModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </>
  );
}
