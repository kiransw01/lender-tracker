import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function PersonModal({ person, onClose, onSaved }) {
  const isEdit = Boolean(person);
  const [name, setName] = useState(person?.name || '');
  const [notes, setNotes] = useState(person?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = isEdit
        ? await api.updatePerson(person.id, { name, notes })
        : await api.createPerson({ name, notes });
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
        <h3>{isEdit ? 'Edit person' : 'Add person'}</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manu" />
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. cousin" />
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
