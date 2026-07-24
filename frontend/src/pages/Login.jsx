import { useState } from 'react';
import { auth } from '../auth.js';

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.authenticate(username, password);
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
        <p className="login-subtitle">Track money you've lent, simply and privately.</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose or enter your username"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" className="primary login-btn" disabled={loading}>
            {loading ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <p className="login-note">
          New here? Just enter a username and password to create your account.
          Returning? Use the same details to log back in — your data syncs across devices.
        </p>
      </div>
    </div>
  );
}
