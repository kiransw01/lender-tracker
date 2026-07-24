import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { auth } from '../auth.js';
import { getStoredTheme, toggleTheme } from '../theme.js';
import PersonCard from '../components/PersonCard.jsx';
import PersonModal from '../components/PersonModal.jsx';
import AccountSettingsModal from '../components/AccountSettingsModal.jsx';
import { formatCurrency } from '../format.js';

export default function PeopleList({ onLogout }) {
  const [people, setPeople] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState(getStoredTheme());
  const [displayName, setDisplayName] = useState(auth.getDisplayName());
  const fileInputRef = useRef(null);

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

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [people, search]);

  async function handleExport() {
    const data = await api.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lender-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!window.confirm('This will replace all current data with the backup file. Continue?')) return;
      await api.importData(text);
      await load();
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  }

  function handleLogout() {
    auth.logout();
    onLogout?.();
  }

  function handleToggleTheme() {
    setTheme(toggleTheme());
  }

  return (
    <>
      <header className="top">
        <div>
          <h1>Lender Tracker</h1>
          {displayName && <p className="header-greeting">Welcome, {displayName}</p>}
        </div>
        <div className="header-actions">
          <button
            className="secondary theme-toggle"
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="secondary" onClick={() => setShowSettings(true)} title="Account settings">
            ⚙️
          </button>
          <button className="secondary" onClick={handleExport}>Export</button>
          <button className="secondary" onClick={handleImportClick}>Import</button>
          <button className="secondary" onClick={handleLogout}>Logout</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
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

      {people.length > 0 && (
        <div className="search-box">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people by name…"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : people.length === 0 ? (
        <div className="empty-state">No people yet. Tap + to add someone.</div>
      ) : filteredPeople.length === 0 ? (
        <div className="empty-state">No matches for "{search}".</div>
      ) : (
        <div className="person-list">
          {filteredPeople.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add person">+</button>

      {showAdd && (
        <PersonModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {showSettings && (
        <AccountSettingsModal
          onClose={() => setShowSettings(false)}
          onProfileUpdated={(newName) => setDisplayName(newName)}
        />
      )}
    </>
  );
}
