import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import TransactionModal from '../components/TransactionModal.jsx';
import PersonModal from '../components/PersonModal.jsx';
import { formatCurrency, formatDate } from '../format.js';

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editingPerson, setEditingPerson] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPerson(id);
      setPerson(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDeletePerson() {
    if (!window.confirm(`Delete ${person.name} and all their transactions?`)) return;
    await api.deletePerson(id);
    navigate('/');
  }

  async function handleDeleteTx(txId) {
    if (!window.confirm('Delete this transaction?')) return;
    await api.deleteTransaction(txId);
    load();
  }

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!person) return null;

  const balanceClass = person.balance > 0 ? 'positive' : 'zero';

  return (
    <>
      <Link to="/" className="back-link">← Back</Link>
      <div className="detail-header">
        <div>
          <h2>{person.name}</h2>
          {person.notes && <div className="notes">{person.notes}</div>}
        </div>
        <div className="detail-header-actions">
          <button className="secondary" onClick={() => setEditingPerson(true)}>Edit</button>
          <button className="secondary danger" onClick={handleDeletePerson}>Delete</button>
        </div>
      </div>

      <div className="balance-banner">
        <div className="label">Outstanding balance</div>
        <div className={`amount ${balanceClass}`}>{formatCurrency(person.balance)}</div>
      </div>

      <div className="tx-actions">
        <button className="primary" onClick={() => setShowAdd(true)}>+ Add transaction</button>
      </div>

      {person.transactions.length === 0 ? (
        <div className="empty-state">No transactions yet.</div>
      ) : (
        <div className="tx-list">
          {person.transactions.map((tx) => (
            <div className="tx-row" key={tx.id}>
              <div className="tx-main">
                <span className={`tx-amount ${tx.type === 'GIVEN' ? 'given' : 'repaid'}`}>
                  {tx.type === 'GIVEN' ? '−' : '+'} {formatCurrency(tx.amount)}
                </span>
                {tx.note && <span className="tx-note">{tx.note}</span>}
                <span className="tx-date">{formatDate(tx.date)}</span>
              </div>
              <div className="tx-row-actions">
                <button className="tx-edit" onClick={() => setEditingTx(tx)}>Edit</button>
                <button className="tx-delete" onClick={() => handleDeleteTx(tx.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <TransactionModal
          personId={id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {editingTx && (
        <TransactionModal
          personId={id}
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={() => {
            setEditingTx(null);
            load();
          }}
        />
      )}

      {editingPerson && (
        <PersonModal
          person={person}
          onClose={() => setEditingPerson(false)}
          onSaved={() => {
            setEditingPerson(false);
            load();
          }}
        />
      )}
    </>
  );
}
