import { useState } from 'react';
import { auth } from '../auth.js';
import { verifyBiometricCredential, isBiometricSupported } from '../webauthn.js';
import LoginBackground from '../components/LoginBackground.jsx';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function QuickUnlock({ username, onUnlocked, onUseFullLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasBiometric = auth.hasBiometric(username) && isBiometricSupported();
  const hasPin = auth.hasPin(username);
  const name = auth.getRememberedDisplayName() || username;

  async function handlePinSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.verifyPin(username, pin);
      auth.resumeSession(username);
      onUnlocked();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    setError('');
    setLoading(true);
    try {
      const credentialId = auth.getBiometricCredentialId(username);
      await verifyBiometricCredential(credentialId);
      auth.resumeSession(username);
      onUnlocked();
    } catch (err) {
      setError('Biometric unlock failed or was cancelled. Try your PIN or password instead.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <LoginBackground />
      <div className="login-card unlock-card">
        <div className="unlock-avatar">{getInitials(name)}</div>
        <p className="unlock-greeting">Welcome back</p>
        <h1 className="unlock-name">{name}</h1>

        {error && <div className="error-banner">{error}</div>}

        {hasBiometric && (
          <button
            type="button"
            className="primary login-btn biometric-btn"
            onClick={handleBiometric}
            disabled={loading}
          >
            <span className="biometric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 1a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V6a5 5 0 0 0-5-5Z" />
                <path d="M8 11v1a4 4 0 0 0 8 0v-1M5 11c0 5 3 9 7 9s7-4 7-9M12 15v4" strokeLinecap="round" />
              </svg>
            </span>
            Unlock with Face ID / Touch ID
          </button>
        )}

        {hasPin && (
          <form onSubmit={handlePinSubmit} className="pin-form">
            <div className="pin-dots-field">
              <input
                autoFocus={!hasBiometric}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="pin-input"
              />
            </div>
            <button type="submit" className="primary login-btn" disabled={loading || pin.length < 4}>
              {loading ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        )}

        <button type="button" className="link-btn" onClick={onUseFullLogin}>
          Not you? Use username &amp; password
        </button>
      </div>
    </div>
  );
}
