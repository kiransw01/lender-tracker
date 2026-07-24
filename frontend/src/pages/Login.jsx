import { useState } from 'react';
import { auth } from '../auth.js';
import RecoveryCodeModal from '../components/RecoveryCodeModal.jsx';

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  // forgot-password fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetDone, setResetDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await auth.authenticate(username, password);
      if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
      } else {
        auth.rememberDevice(result.username);
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.resetPasswordWithRecoveryCode(username, resetCode, newPassword);
      setResetDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverySaved() {
    auth.rememberDevice(username);
    setRecoveryCode('');
    onSuccess();
  }

  if (recoveryCode) {
    return <RecoveryCodeModal code={recoveryCode} onClose={handleRecoverySaved} />;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">₹</div>
        <h1>Lender Tracker</h1>
        <p className="login-subtitle">Track money you've lent, simply and privately.</p>

        {error && <div className="error-banner">{error}</div>}

        {mode === 'login' ? (
          <>
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

            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode('forgot');
                setError('');
              }}
            >
              Forgot password?
            </button>

            <p className="login-note">
              New here? Just enter a username and password to create your account.
              Returning? Use the same details to log back in — your data syncs across devices.
            </p>
          </>
        ) : resetDone ? (
          <>
            <p className="login-subtitle">
              Your password has been reset. You can now continue with your new password.
            </p>
            <button
              type="button"
              className="primary login-btn"
              onClick={() => {
                auth.rememberDevice(username);
                onSuccess();
              }}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleReset}>
              <div className="field">
                <label>Username</label>
                <input
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>
              <div className="field">
                <label>Recovery code</label>
                <input
                  autoCapitalize="characters"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                />
              </div>
              <button type="submit" className="primary login-btn" disabled={loading}>
                {loading ? 'Please wait…' : 'Reset password'}
              </button>
            </form>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
