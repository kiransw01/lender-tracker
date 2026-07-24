# Lender Tracker

A simple app to track money lent to relatives/friends — who you gave money to, how much,
when, and how much has been repaid. Works as a web app and as an installable "mobile app"
(PWA — Progressive Web App, add to your phone's home screen).

## Stack

- **Backend**: Node.js + Express + SQLite (`better-sqlite3`) — single-file DB, zero setup
- **Frontend**: React + Vite, installable as a PWA (works on Android/iOS home screen)

## Features

- Add people (lenders you've given money to)
- Add transactions per person: `GIVEN` (money you lent) or `REPAID` (money they paid back),
  with amount, date, and a note (e.g. "site registration", "TV EMI", "PayTM")
- Auto-calculated running balance (outstanding amount) per person
- Overall total outstanding across everyone
- Works offline-ish once installed as a PWA; installable on mobile home screen

## Project structure

```
lender-tracker/
  backend/     Express + SQLite API
  frontend/    React + Vite PWA
```

## Running locally

### 1. Backend

```bash
cd backend
npm install
npm run seed     # optional: adds a couple of dummy people/transactions
npm run dev       # starts API on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts app on http://localhost:5173
```

The frontend expects the API at `http://localhost:4000` by default (see `frontend/.env`).

### 3. Installing as a "mobile app"

Once the frontend is running (or deployed), open it in Chrome/Safari on your phone and use
**"Add to Home Screen"**. It will behave like a native app (its own icon, full-screen, works
offline for cached pages) thanks to the PWA setup.

## Deploying

- **Backend**: any Node host (Render, Railway, Fly.io, a VM, etc.) — just needs to persist
  the `data.sqlite` file (or swap in a hosted Postgres/SQLite later).
- **Frontend**: any static host (Vercel, Netlify, GitHub Pages) — set `VITE_API_URL` to your
  deployed backend URL at build time.

## Data model

**Person**: `id`, `name`, `notes` (optional)

**Transaction**: `id`, `person_id`, `type` (`GIVEN` | `REPAID`), `amount`, `date`, `note`

Outstanding balance for a person = sum(`GIVEN`) − sum(`REPAID`).

## Privacy note

This repo is set up with placeholder/dummy seed data only. Enter your real lending data
through the running app — avoid committing real names/amounts into the git history.
