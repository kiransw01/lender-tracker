import { useState } from 'react';
import { auth } from '../auth.js';

export default function Login({ onSuccess }) {
  const isFirstTime = !auth.isRegistered();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.signIn(phone);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">₹</div>
        <h1>Lender Tracker</h1>
        <p className="login-subtitle">
          {isFirstTime
            ? 'Enter your phone number to create your account.'
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
          <button type="submit" className="primary login-btn" disabled={loading}>
            {loading ? 'Please wait…' : isFirstTime ? 'Create account & continue' : 'Continue'}
          </button>
        </form>
        <p className="login-note">
          Your data is stored in the cloud, keyed to this phone number. Use the same
          number on any device to see the same data. Don't share this app link + your
          number publicly — anyone with both can view your data.
        </p>
      </div>
    </div>
  );
}
