// Simple local device-lock auth: no server, no real SMS OTP.
// First run: user sets their phone number as their "username" (stored in localStorage).
// Every subsequent app open: user must re-enter that same phone number to unlock.
// This is NOT secure authentication (data is in the same browser regardless) — it's a
// lightweight gate to avoid casual/accidental access on a shared device.

const AUTH_KEY = 'lender-tracker-auth-v1';
const SESSION_KEY = 'lender-tracker-session-v1';

function normalizePhone(phone) {
  return (phone || '').replace(/[\s\-()]/g, '').trim();
}

export const auth = {
  isRegistered() {
    return Boolean(localStorage.getItem(AUTH_KEY));
  },

  getRegisteredPhone() {
    return localStorage.getItem(AUTH_KEY) || '';
  },

  register(phone) {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 6) {
      throw new Error('Enter a valid phone number');
    }
    localStorage.setItem(AUTH_KEY, normalized);
    sessionStorage.setItem(SESSION_KEY, '1');
  },

  login(phone) {
    const normalized = normalizePhone(phone);
    const registered = localStorage.getItem(AUTH_KEY);
    if (normalized !== registered) {
      throw new Error('Phone number does not match');
    }
    sessionStorage.setItem(SESSION_KEY, '1');
  },

  isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  resetRegistration() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  },
};
