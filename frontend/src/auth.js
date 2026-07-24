// Username + password identity, backed by Firestore for real persistence.
//
// This is a lightweight app-level auth, not a bank-grade auth system:
//   - Passwords are hashed (SHA-256 + per-account salt) before being stored/compared,
//     never stored in plaintext.
//   - We still sign in anonymously to Firebase under the hood, just to satisfy
//     Firestore's "must be authenticated" security rule — the username/password
//     check itself is done in application code against the stored hash.
//   - One Firestore doc per username (users/{username}) holds the account's salt,
//     password hash, and all app data (people/transactions).
//
// Backward compatibility: accounts created before this feature (username = phone
// number, no password) are auto-migrated the first time that username is used to
// log in — whatever password is entered then becomes the account's password.

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, ensureFirebaseSignedIn } from './firebase.js';
import { generateSalt, hashPassword } from './crypto.js';

const SESSION_KEY = 'lender-tracker-session-v1';
const USERNAME_KEY = 'lender-tracker-username-v1';

function normalizeUsername(username) {
  return (username || '').trim().toLowerCase();
}

function userDocRef(username) {
  return doc(db, 'users', username);
}

export const auth = {
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
   * - New username → creates the account with this password.
   * - Existing username with no password set yet (legacy data) → sets this
   *   password on the existing account (no data lost).
   * - Existing username with a password → verifies it matches.
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

    if (!snap.exists()) {
      // Sign up: brand new account
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      await setDoc(ref, {
        salt,
        passwordHash,
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
        await updateDoc(ref, { salt, passwordHash });
      } else {
        const candidateHash = await hashPassword(password, data.salt);
        if (candidateHash !== data.passwordHash) {
          throw new Error('Incorrect password');
        }
      }
    }

    sessionStorage.setItem(USERNAME_KEY, username);
    sessionStorage.setItem(SESSION_KEY, '1');
    return username;
  },
};
