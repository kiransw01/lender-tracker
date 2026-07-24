// Phone-number identity, backed by Firestore for real persistence.
//
// This is NOT real SMS/OTP-verified authentication — Firebase Phone Auth requires
// billing/reCAPTCHA setup we're skipping for simplicity. Instead:
//   - Your phone number is your "account key" in Firestore (users/{phone})
//   - We sign in anonymously to Firebase under the hood just to satisfy Firestore's
//     auth requirement
//   - Anyone who knows your exact phone number could technically open your data if
//     they also have the app URL — same trust model as a shared bookmark/password
//     you haven't told anyone. Don't share your phone number+app link publicly.
//
// The upside: your data now lives in the cloud (Firestore), not just one browser's
// localStorage, so clearing browser data / reinstalling / switching devices no
// longer wipes it.

import { ensureFirebaseSignedIn } from './firebase.js';

const REGISTERED_PHONE_KEY = 'lender-tracker-phone-v1';
const SESSION_KEY = 'lender-tracker-session-v1';

function normalizePhone(phone) {
  return (phone || '').replace(/[\s\-()]/g, '').trim();
}

export const auth = {
  normalizePhone,

  isRegistered() {
    return Boolean(localStorage.getItem(REGISTERED_PHONE_KEY));
  },

  getRegisteredPhone() {
    return localStorage.getItem(REGISTERED_PHONE_KEY) || '';
  },

  async signIn(phone) {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 6) {
      throw new Error('Enter a valid phone number');
    }
    await ensureFirebaseSignedIn();
    localStorage.setItem(REGISTERED_PHONE_KEY, normalized);
    sessionStorage.setItem(SESSION_KEY, '1');
    return normalized;
  },

  isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1' && this.isRegistered();
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  switchAccount() {
    localStorage.removeItem(REGISTERED_PHONE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  },
};
