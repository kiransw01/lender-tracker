import { useEffect, useState } from 'react';
import { auth } from '../auth.js';
import { isBiometricSupported, registerBiometricCredential } from '../webauthn.js';

export default function AccountSettingsModal({ onClose, onProfileUpdated }) {
  const username = auth.getUsername();
  const [tab, setTab] = useState('profile'); // 'profile' | 'password' | 'unlock'

  // profile
  const [displayName, setDisplayName] = useState(auth.getDisplayName() || username);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // PIN setup
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [hasPin, setHasPin] = useState(auth.hasPin(username));

  // biometric
  const [bioError, setBioError] = useState('');
  const [bioSuccess, setBioSuccess] = useState('');
  const [hasBiometric, setHasBiometric] = useState(auth.hasBiometric(username));
  const biometricSupported = isBiometricSupported();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwSaving(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSetupPin(e) {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    if (pin !== pinConfirm) {
      setPinError('PINs do not match');
      return;
    }
    try {
      await auth.setupPin(username, pin);
      setHasPin(true);
      setPinSuccess('PIN set up for quick unlock on this device.');
      setPin('');
      setPinConfirm('');
    } catch (err) {
      setPinError(err.message);
    }
  }

  function handleRemovePin() {
    auth.removePin(username);
    setHasPin(false);
    setPinSuccess('');
  }

  async function handleSetupBiometric() {
    setBioError('');
    setBioSuccess('');
    try {
      const credentialId = await registerBiometricCredential(username);
      auth.saveBiometricCredentialId(username, credentialId);
      setHasBiometric(true);
      setBioSuccess('Biometric unlock enabled on this device.');
    } catch (err) {
      setBioError('Could not set up biometric unlock: ' + err.message);
    }
  }

  function handleRemoveBiometric() {
    auth.removeBiometric(username);
    setHasBiometric(false);
    setBioSuccess('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Account settings</h3>

        <div className="settings-tabs">
          <button
            className={tab === 'profile' ? 'active' : ''}
            onClick={() => setTab('profile')}
          >
            Profile
          </button>
          <button
            className={tab === 'password' ? 'active' : ''}
            onClick={() => setTab('password')}
          >
            Password
          </button>
          <button
            className={tab === 'unlock' ? 'active' : ''}
            onClick={() => setTab('unlock')}
          >
            Quick unlock
          </button>
        </div>

        {tab === 'profile' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setNameError('');
              setNameSuccess('');
              setNameSaving(true);
              try {
                const saved = await auth.updateDisplayName(displayName);
                setNameSuccess('Name updated.');
                onProfileUpdated?.(saved);
              } catch (err) {
                setNameError(err.message);
              } finally {
                setNameSaving(false);
              }
            }}
          >
            {nameError && <div className="error-banner">{nameError}</div>}
            {nameSuccess && <div className="success-banner">{nameSuccess}</div>}
            <div className="field">
              <label>Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={username} disabled />
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Close</button>
              <button type="submit" className="primary" disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save name'}
              </button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleChangePassword}>
            {pwError && <div className="error-banner">{pwError}</div>}
            {pwSuccess && <div className="success-banner">{pwSuccess}</div>}
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Close</button>
              <button type="submit" className="primary" disabled={pwSaving}>
                {pwSaving ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        )}

        {tab === 'unlock' && (
          <div>
            <p className="settings-subtitle">
              Quick unlock lets you skip typing your password every time, on this device only.
            </p>

            <div className="settings-section">
              <h4>PIN</h4>
              {pinError && <div className="error-banner">{pinError}</div>}
              {pinSuccess && <div className="success-banner">{pinSuccess}</div>}
              {hasPin ? (
                <div className="settings-row">
                  <span>PIN unlock is enabled on this device.</span>
                  <button className="secondary danger" onClick={handleRemovePin}>Remove</button>
                </div>
              ) : (
                <form onSubmit={handleSetupPin}>
                  <div className="field">
                    <label>New PIN (4–6 digits)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="field">
                    <label>Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <button type="submit" className="primary">Set up PIN</button>
                </form>
              )}
            </div>

            <div className="settings-section">
              <h4>Biometric (Face ID / Touch ID / Fingerprint)</h4>
              {bioError && <div className="error-banner">{bioError}</div>}
              {bioSuccess && <div className="success-banner">{bioSuccess}</div>}
              {!biometricSupported ? (
                <p className="settings-hint">Not supported on this device/browser.</p>
              ) : hasBiometric ? (
                <div className="settings-row">
                  <span>Biometric unlock is enabled on this device.</span>
                  <button className="secondary danger" onClick={handleRemoveBiometric}>Remove</button>
                </div>
              ) : (
                <button className="primary" onClick={handleSetupBiometric}>
                  Set up biometric unlock
                </button>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
