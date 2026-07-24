# Lender Tracker

A simple app to track money lent to relatives/friends — who you gave money to, how much,
when, and how much has been repaid.

## 🚀 Live app (one click, no install)

**https://kiransw01.github.io/lender-tracker/**

Open on your phone or computer. Enter your phone number once to create your account —
your data is stored in **Firebase Firestore (cloud)**, keyed to that phone number, and
persists forever (until you delete it) across devices/browsers.

On mobile, tap **Share → Add to Home Screen** (iOS) or the install prompt (Android/Chrome)
for a native-app-like icon.

## How it works

- **Frontend**: React + Vite, static PWA, deployed to GitHub Pages (`gh-pages` branch)
- **Storage**: Firebase **Firestore** — one document per phone number holding all your
  people + transactions. Real cloud persistence, not tied to one browser.
- **Login**: phone number is used as your account key. This is **not real SMS/OTP-verified
  authentication** (that requires Firebase billing + reCAPTCHA setup) — under the hood we
  sign in anonymously to Firebase just to satisfy Firestore's auth requirement. Practically,
  this means: whoever knows your exact phone number *and* has this app's link can view your
  data. Don't share your phone number + this link publicly. Treat your phone number here
  like a lightweight password.
- **Data model**: People (name, notes) + Transactions (`GIVEN`/`REPAID`, amount, date, note).
  Balance per person = sum(`GIVEN`) − sum(`REPAID`), computed automatically.

## Firebase project setup (one-time, already done for this deployment)

This repo is wired to Firebase project `lender-tracker-43e16`. To use your own Firebase
project instead:

1. Create a project at https://console.firebase.google.com
2. **Build → Firestore Database → Create database** (any region, start in production mode)
3. **Build → Authentication → Sign-in method → Anonymous → Enable**
   (we use anonymous auth under the hood, not real phone/SMS verification)
4. **Firestore Database → Rules** — paste the contents of `firestore.rules` from this repo
   and Publish
5. **Project settings → General → Your apps → Web app** — copy the config object
6. Paste that config into `frontend/src/firebase.js`

## Local development

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Deploying updates to GitHub Pages

Since GitHub Actions had reliability issues installing npm packages in CI, this repo
deploys by building locally and pushing the static output to the `gh-pages` branch:

```bash
cd frontend
npm run build
# copy dist/ contents to a fresh gh-pages branch and force-push
```

## Backup / restore

Use the **Export** button (in the app header) to download a JSON backup of your data
at any time, and **Import** to restore/merge a backup file back in — useful if you ever
want an offline copy independent of Firebase.

## Privacy note

No real financial data is committed to this repository. All personal entries live in
Firestore under your phone number, or in your exported backup files, which you control.
