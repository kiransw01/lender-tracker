// Username + password identity, backed by Firestore for real persistence, plus:
//   - Change password (while logged in)
//   - Forgot password via a recovery code shown once at signup
//   - "Remembered device" quick-unlock via PIN or biometric (WebAuthn platform
//     authenticator), so you don't have to retype your password every time on
//     a device you trust.
//
// This is a lightweight app-level auth, not a bank-grade auth system:
//   - Passwords/PINs are hashed (SHA-256 + per-account salt), never stored in
//     plaintext.
//   - We still sign in anonymously to Firebase under the hood, just to satisfy
//     Firestore's "must be authenticated" security rule — the username/password
//     check itself is done in application code against the stored hash.
//   - Quick-unlock (PIN/biometric) is a LOCAL, per-device convenience layer on
//     top of an already-remembered login — it does not replace the underlying
//     account password, and only works on a device where you've previously
//     logged in with your username+password and explicitly enabled it.

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, ensureFirebaseSignedIn } from './firebase.js';
import { generateSalt, hashPassword } from './crypto.js';

const SESSION_KEY = 'lender-tracker-session-v1';
const USERNAME_KEY = 'lender-tracker-username-v1';
const REMEMBERED_USERNAME_KEY = 'lender-tracker-remembered-username-v1';
const PIN_KEY_PREFIX = 'lender-tracker-pin-v1:';
const BIOMETRIC_KEY_PREFIX = 'lender-tracker-biometric-v1:';

function normalizeUsername(username) {
  return (username || '').trim().toLowerCase();
}

function userDocRef(username) {
  return doc(db, 'users', username);
}

function generateRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => chars[b % chars.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function normalizeRecoveryCode(code) {
  return (code || '').trim().toUpperCase();
}

export const auth = {
  normalizeUsername,

  getUsername() {
    return sessionStorage.getItem(USERNAME_KEY) || '';
  },

  isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1' && Boolean(this.getUsername());
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
  },

  /**
   * Handles sign-up, login, and legacy-account password migration in one step:
   * - New username → creates the account with this password + a recovery code
   *   (returned so the UI can show it once).
   * - Existing username with no password set yet (legacy data) → sets this
   *   password on the existing account (no data lost).
   * - Existing username with a password → verifies it matches.
   *
   * Returns { username, recoveryCode } — recoveryCode is only present right
   * after a brand-new account is created (show it to the user once).
   */
  async authenticate(usernameInput, password) {
    const username = normalizeUsername(usernameInput);
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    await ensureFirebaseSignedIn();
    const ref = userDocRef(username);
    const snap = await getDoc(ref);

    let recoveryCode;

    if (!snap.exists()) {
      // Sign up: brand new account
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      recoveryCode = generateRecoveryCode();
      const recoverySalt = generateSalt();
      const recoveryCodeHash = await hashPassword(normalizeRecoveryCode(recoveryCode), recoverySalt);
      await setDoc(ref, {
        salt,
        passwordHash,
        recoverySalt,
        recoveryCodeHash,
        people: [],
        transactions: [],
        nextPersonId: 1,
        nextTxId: 1,
      });
    } else {
      const data = snap.data();
      if (!data.passwordHash) {
        // Legacy account (created before passwords existed) — set it now.
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        recoveryCode = generateRecoveryCode();
        const recoverySalt = generateSalt();
        const recoveryCodeHash = await hashPassword(normalizeRecoveryCode(recoveryCode), recoverySalt);
        await updateDoc(ref, { salt, passwordHash, recoverySalt, recoveryCodeHash });
      } else {
        const candidateHash = await hashPassword(password, data.salt);
        if (candidateHash !== data.passwordHash) {
          throw new Error('Incorrect password');
        }
      }
    }

    sessionStorage.setItem(USERNAME_KEY, username);
    sessionStorage.setItem(SESSION_KEY, '1');
    return { username, recoveryCode };
  },

  /** Change password while logged in (requires current password). */
  async changePassword(currentPassword, newPassword) {
    const username = this.getUsername();
    if (!username) throw new Error('Not signed in');
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters');
    }
    await ensureFirebaseSignedIn();
    const ref = userDocRef(username);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Account not found');
    const data = snap.data();
    const currentHash = await hashPassword(currentPassword, data.salt);
    if (currentHash !== data.passwordHash) {
      throw new Error('Current password is incorrect');
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    await updateDoc(ref, { salt, passwordHash });
  },

  /** Reset password using a recovery code (for users who forgot their password). */
  async resetPasswordWithRecoveryCode(usernameInput, recoveryCodeInput, newPassword) {
    const username = normalizeUsername(usernameInput);
    const recoveryCode = normalizeRecoveryCode(recoveryCodeInput);
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters');
    }
    await ensureFirebaseSignedIn();
    const ref = userDocRef(username);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Account not found');
    const data = snap.data();
    if (!data.recoveryCodeHash) {
      throw new Error('No recovery code was ever set up for this account. Contact support.');
    }
    const candidateHash = await hashPassword(recoveryCode, data.recoverySalt);
    if (candidateHash !== data.recoveryCodeHash) {
      throw new Error('Invalid recovery code');
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    await updateDoc(ref, { salt, passwordHash });

    sessionStorage.setItem(USERNAME_KEY, username);
    sessionStorage.setItem(SESSION_KEY, '1');
    return username;
  },

  /** Generate a brand-new recovery code for the logged-in account (invalidates the old one). */
  async regenerateRecoveryCode() {
    const username = this.getUsername();
    if (!username) throw new Error('Not signed in');
    const recoveryCode = generateRecoveryCode();
    const recoverySalt = generateSalt();
    const recoveryCodeHash = await hashPassword(normalizeRecoveryCode(recoveryCode), recoverySalt);
    await updateDoc(userDocRef(username), { recoverySalt, recoveryCodeHash });
    return recoveryCode;
  },

  // --- "Remembered device" quick-unlock (local convenience layer) ---

  rememberDevice(username) {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, normalizeUsername(username));
  },

  getRememberedUsername() {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) || '';
  },

  forgetDevice() {
    const username = this.getRememberedUsername();
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    if (username) {
      localStorage.removeItem(PIN_KEY_PREFIX + username);
      localStorage.removeItem(BIOMETRIC_KEY_PREFIX + username);
    }
  },

  /** Resume a session for a remembered device without re-entering a password. */
  resumeSession(username) {
    sessionStorage.setItem(USERNAME_KEY, normalizeUsername(username));
    sessionStorage.setItem(SESSION_KEY, '1');
  },

  // PIN quick-unlock
  hasPin(username) {
    return Boolean(localStorage.getItem(PIN_KEY_PREFIX + normalizeUsername(username)));
  },

  async setupPin(username, pin) {
    if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN must be 4–6 digits');
    const salt = generateSalt();
    const hash = await hashPassword(pin, salt);
    localStorage.setItem(PIN_KEY_PREFIX + normalizeUsername(username), JSON.stringify({ salt, hash }));
  },

  async verifyPin(username, pin) {
    const raw = localStorage.getItem(PIN_KEY_PREFIX + normalizeUsername(username));
    if (!raw) throw new Error('No PIN set up on this device');
    const { salt, hash } = JSON.parse(raw);
    const candidate = await hashPassword(pin, salt);
    if (candidate !== hash) throw new Error('Incorrect PIN');
    return true;
  },

  removePin(username) {
    localStorage.removeItem(PIN_KEY_PREFIX + normalizeUsername(username));
  },

  // Biometric quick-unlock (credential ID stored locally per username)
  hasBiometric(username) {
    return Boolean(localStorage.getItem(BIOMETRIC_KEY_PREFIX + normalizeUsername(username)));
  },

  saveBiometricCredentialId(username, credentialIdBase64) {
    localStorage.setItem(BIOMETRIC_KEY_PREFIX + normalizeUsername(username), credentialIdBase64);
  },

  getBiometricCredentialId(username) {
    return localStorage.getItem(BIOMETRIC_KEY_PREFIX + normalizeUsername(username)) || '';
  },

  removeBiometric(username) {
    localStorage.removeItem(BIOMETRIC_KEY_PREFIX + normalizeUsername(username));
  },
};
