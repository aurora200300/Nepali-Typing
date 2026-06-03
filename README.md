# PreetiFont Pro V2.1 - Windows Fixed Full-Stack Starter

This version is made for Windows users who got `better-sqlite3` / `node-gyp` / Visual Studio C++ errors.

It uses:

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: JSON file at `server/data/preeti_typing_data.json`
- Auth: JWT + bcryptjs
- Features: demo login, Google-ready login endpoint, dashboard, lessons, practice session saving, leaderboard, achievements, admin API, light/dark/3D theme, English/Nepali language toggle

## Run on Windows PowerShell

```powershell
cd server
copy .env.example .env
npm install
npm run seed
npm run dev
```

Open:

```text
http://localhost:5050
```

## Admin login

```text
Email: admin@preetifont.local
Password: admin123
```

## Important fix

If your old install failed, delete old `node_modules` first:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## Why this version works better on your laptop

The previous version used `better-sqlite3`, which is fast but needs native binaries. On your PC, Node 26 could not find a prebuilt binary and then needed Visual Studio C++ build tools. This version avoids that problem completely.

## Production note

For a real public website, replace the JSON store with PostgreSQL from Supabase/Neon and use real Google OAuth verification.
