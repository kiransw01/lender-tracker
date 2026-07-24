import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDOSCY6xv1wsaT7k4XdR4QEuc_HEHtqeC8',
  authDomain: 'lender-tracker-43e16.firebaseapp.com',
  projectId: 'lender-tracker-43e16',
  storageBucket: 'lender-tracker-43e16.firebasestorage.app',
  messagingSenderId: '1061714185406',
  appId: '1:1061714185406:web:944f0e59c7011a1918e2ef',
};

export const firebaseApp = initializeApp(firebaseConfig);

// Force long-polling instead of WebChannel/streaming — this avoids
// "client is offline" errors in Safari Private Browsing, strict tracking
// prevention, and some corporate/VPN networks that block the default
// connection style Firestore normally uses.
export const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const firebaseAuth = getAuth(firebaseApp);

let anonSignInPromise = null;

// Firestore security rules require an authenticated request. Since we don't do
// real SMS/OTP verification, we sign in anonymously under the hood just to
// satisfy that requirement — the phone number itself is what "keys" your data
// (see auth.js). This is not strong security; see README for details.
export function ensureFirebaseSignedIn() {
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser);
  if (!anonSignInPromise) {
    anonSignInPromise = signInAnonymously(firebaseAuth).then((cred) => cred.user);
  }
  return anonSignInPromise;
}
