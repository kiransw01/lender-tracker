export default function RecoveryCodeModal({ code, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Save your recovery code</h3>
        <p className="recovery-note">
          If you ever forget your password, you'll need this code to reset it.
          It's shown <strong>only once</strong> — write it down or save it somewhere safe.
        </p>
        <div className="recovery-code">{code}</div>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => navigator.clipboard?.writeText(code)}
          >
            Copy
          </button>
          <button type="button" className="primary" onClick={onClose}>
            I've saved it
          </button>
        </div>
      </div>
    </div>
  );
}
