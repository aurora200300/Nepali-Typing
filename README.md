# PreetiFont Pro V2

Advanced full-stack starter for a Nepali Preeti Font typing practice website.

## Included features

- Professional 3D / light / dark dashboard UI
- English and Nepali language toggle
- Demo login and email-ready authentication API
- Google-login-ready endpoint
- JWT protected user dashboard
- SQLite database with migration
- Lessons API and admin-only lesson creation
- Typing practice with live WPM, accuracy, mistakes and timer
- Daily dashboard with practice time, score, streak and recent sessions
- 7-day performance chart
- Leaderboard API
- Achievements system
- Admin overview API
- Mobile responsive design

## Tech stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: SQLite using better-sqlite3
- Auth: JWT, bcrypt password hashing
- Validation: Zod
- Security: Helmet, CORS

## Run locally

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

Open:

```text
http://localhost:5050
```

Demo login is available from the UI.

Admin account after seed:

```text
Email: admin@preetifont.local
Password: admin123
```

## Google Login setup

The project includes `/api/auth/google` as a Google-login-ready endpoint. For production, connect a real Google OAuth client:

1. Go to Google Cloud Console.
2. Create OAuth Client ID.
3. Add your website domain to authorized origins.
4. Put your client ID in `.env`.
5. In production, verify Google `idToken` on the server using `google-auth-library` before creating a user.

## Deployment idea

Free/low-cost options:

- Frontend + backend: Render, Railway, Fly.io, or VPS
- Database: PostgreSQL on Supabase/Neon for production
- Static frontend only: Netlify/Vercel

For production, replace SQLite with PostgreSQL if many users will use the site.
