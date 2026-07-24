# Lender Tracker

A simple app to track money lent to relatives/friends — who you gave money to, how much,
when, and how much has been repaid.

## 🚀 Live app (one click, no install)

**https://kiransw01.github.io/lender-tracker/**

Open that link on your phone or computer and it just works — no signup, no server.
Your data is stored **only in your own browser** (localStorage), never sent anywhere.

On mobile, tap **Share → Add to Home Screen** (iOS) or the **install prompt** (Android/Chrome)
to make it behave like a native app icon on your home screen.

> ⚠️ Since data lives in your browser, it's per-device/per-browser. Use the **Export** button
> on the home screen to download a JSON backup, and **Import** it on another device/browser to
> move your data over.

## How it works

- **Frontend**: React + Vite, built as a static PWA, auto-deployed to GitHub Pages via
  GitHub Actions on every push to `main` (see `.github/workflows/deploy.yml`)
- **Storage**: browser `localStorage` — no backend server, no database to host
- **Data model**: People (name, notes) + Transactions (`GIVEN` or `REPAID`, amount, date, note).
  Outstanding balance per person = sum(`GIVEN`) − sum(`REPAID`), computed automatically.

## Optional: self-hosted backend (advanced)

An Express + SQLite backend (`backend/`) is also included if you'd rather run a real server
+ database instead of browser storage (e.g. to sync across devices yourself). It's **not**
required for the GitHub Pages version above — the frontend works fully standalone.

```bash
cd backend
npm install
npm run seed   # optional dummy data
npm run dev    # http://localhost:4000
```

To point the frontend at this backend instead of localStorage, you'd swap `frontend/src/api.js`
back to fetch-based calls (see git history) and set `VITE_API_URL`.

## Local development (frontend only)

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Deploying your own copy

1. Fork/clone this repo
2. In `frontend/vite.config.js`, set `base: '/<your-repo-name>/'`
3. Push to `main` — GitHub Actions builds and deploys to Pages automatically
4. In your repo → **Settings → Pages** → Source: **GitHub Actions**

## Privacy note

No real financial data is committed to this repository. All personal entries live in your
browser's local storage only, or in your exported backup files, which you control.
