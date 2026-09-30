# LinguaHub

A full-stack language-learning platform: Node.js + Express REST API, MongoDB (Mongoose), Socket.io for realtime XP/streak/friend updates, Firebase Admin for push notifications and Google sign-in, and an AI-assisted lesson/quiz authoring tool (Groq) for teachers. The frontend is a plain HTML/CSS/JS single-page app served from `public/` — no build step required.

Everything in this rebuild reads and writes real data through the API. There is no hardcoded demo user, fake streak, or seeded fake progress anywhere — a freshly registered account starts at 0 XP with an empty streak, exactly as it should.

## Features

- **Auth**: email/password (bcrypt + JWT) and Google sign-in (Firebase), role-based (`student` / `teacher` / `admin`)
- **Lessons**: real vocabulary/grammar/example content for Spanish, French and Japanese (`data/curriculum/`), teachers can author more or draft with AI
- **Quizzes**: server-graded (the API never trusts a client-submitted score), AI-generated on demand, teachers can publish reusable quizzes
- **Progress**: per-lesson completion, weekly XP chart, quiz accuracy — all computed from real logged events, not display placeholders
- **Streaks**: computed in the learner's own timezone, not the server's
- **Speaking practice**: browser Web Speech API + server-side text-similarity scoring
- **Achievements**: unlocked automatically as real thresholds (streak/XP/lessons/quizzes/friends) are crossed
- **Friends & leaderboard**: search, request/accept, weekly and all-time leaderboards (global or friends-only)
- **Notifications**: in-app + Firebase push, teacher/admin broadcast announcements
- **Realtime**: Socket.io pushes XP/streak changes and friend events to open tabs instantly
- **Admin**: role management, platform stats — no hardcoded "admin unlock code"

## Project layout

```
src/
  config/     env loading + validation, MongoDB connection
  models/     Mongoose schemas
  routes/     Express routers (route handlers live here directly — no separate controllers layer)
  services/   token issuing, Firebase Admin, Groq AI calls, XP/streak/achievement logic
  middleware/ auth, validation, error handling, rate limiting
  utils/      pure, unit-tested logic (dates, gamification math, text similarity)
  app.js      Express app wiring
  server.js   HTTP + Socket.io server entrypoint
data/curriculum/   real seed content (lessons, quizzes, achievement catalog) as JSON
scripts/            one-off CLI scripts (curriculum import, admin promotion)
public/             the frontend (static, no build step)
tests/              node:test unit tests for the pure utils
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI` — a MongoDB Atlas (or local) connection string
   - `JWT_SECRET` — any random string, 32+ characters
   - `GROQ_API_KEY` *(optional)* — enables AI lesson/quiz generation; get one free at console.groq.com
   - `FIREBASE_*` *(optional)* — enables push notifications and Google sign-in; from your Firebase project settings

   The server refuses to start with a clear error message if `MONGODB_URI` or `JWT_SECRET` is missing or malformed — it will not silently fall back to fake data.

3. **Load the real curriculum** (Spanish/French/Japanese lessons, matching quizzes, the achievement catalog):
   ```bash
   npm run import:curriculum:check   # preview what would be created, writes nothing
   npm run import:curriculum         # actually write it
   ```
   Safe to re-run — it upserts by title/key rather than duplicating.

4. **Run the server**
   ```bash
   npm run dev     # nodemon, auto-restart
   npm start       # plain node
   ```
   Visit `http://localhost:3000`, register an account, and start learning.

   ```bash
   npm run make-admin -- you@example.com
   ```
   (Register that account first — the script promotes an existing user, it doesn't create one.)

## Tests

```bash
npm test
```
Runs the unit tests for the pure logic (streak math, level math, timezone day-boundaries, speech-similarity scoring) with Node's built-in test runner. These don't need a database.

## Notes on optional integrations

- **Without `GROQ_API_KEY`**: AI generation endpoints return a clear 503 ("AI generation is not configured"); everything else works normally, and the pre-loaded curriculum lessons/quizzes are unaffected.
- **Without Firebase config**: push notifications and Google sign-in no-op / return a clear error; email/password auth and in-app notifications still work fully.
- **CORS**: same-origin by default; set `CORS_ORIGIN` (comma-separated) if you split the frontend onto another domain.
