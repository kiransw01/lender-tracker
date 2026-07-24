import { useState } from 'react';
import { auth } from '../auth.js';
import { verifyBiometricCredential, isBiometricSupported } from '../webauthn.js';

export default function QuickUnlock({ username, onUnlocked, onUseFullLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasBiometric = auth.hasBiometric(username) && isBiometricSupported();
  const hasPin = auth.hasPin(username);

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
      <div className="login-card">
        <div className="login-logo">₹</div>
        <h1>Welcome back, {auth.getRememberedDisplayName() || username}</h1>

        {error && <div className="error-banner">{error}</div>}

        {hasBiometric && (
          <button
            type="button"
            className="primary login-btn biometric-btn"
            onClick={handleBiometric}
            disabled={loading}
          >
            👤 Unlock with Face ID / Touch ID
          </button>
        )}

        {hasPin && (
          <form onSubmit={handlePinSubmit} className="pin-form">
            <div className="field">
              <label>Enter your PIN</label>
              <input
                autoFocus={!hasBiometric}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="pin-input"
              />
            </div>
            <button type="submit" className="primary login-btn" disabled={loading || pin.length < 4}>
              {loading ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        )}

        <button type="button" className="link-btn" onClick={onUseFullLogin}>
          Use username &amp; password instead
        </button>
      </div>
    </div>
  );
}
