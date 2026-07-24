import { useState } from 'react';
import { auth } from '../auth.js';

export default function Login({ onSuccess }) {
  const isFirstTime = !auth.isRegistered();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (isFirstTime) {
        auth.register(phone);
      } else {
        auth.login(phone);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">₹</div>
        <h1>Lender Tracker</h1>
        <p className="login-subtitle">
          {isFirstTime
            ? 'Set your phone number to secure this app on this device.'
            : 'Enter your phone number to continue.'}
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Phone number</label>
            <input
              autoFocus
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
          <button type="submit" className="primary login-btn">
            {isFirstTime ? 'Set up & continue' : 'Unlock'}
          </button>
        </form>
        <p className="login-note">
          Your data stays on this device only. This is a local lock, not an online account.
        </p>
      </div>
    </div>
  );
}
