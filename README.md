# ur-career

An AI career coach that turns a user's background, goals, and the job market into a personalised, evolving career roadmap.

## Stack

- **Frontend** — React + TypeScript, React Router, Tailwind CSS, Vite
- **Backend** — Go (stdlib `net/http`, method-pattern routing), `pgx/v5`
- **Database** — PostgreSQL (Supabase)

## Status

| Module | Status |
|---|---|
| `auth` — register, login, logout, refresh, rate limiting | done, wired |
| `profile` — get/update current role, target role, skills | built, **not yet wired into `main.go`** |
| `roadmap` — curated tree content (Backend, Cloud Computing) | seed tool done; no read/write API yet |
| `resume` | not started |
| `coach` (AI orchestrator) | not started |
| `jobmarket` | not started |
| frontend — landing page, auth pages, dashboard, nav shell | done for existing modules |

## Project structure

```
backend/
  cmd/
    api/              # HTTP server entrypoint
  internal/
    auth/              # signup, login, JWT + refresh tokens, rate limiting
    profile/            # current/target role, skills
    ratelimit/           # in-memory fixed-window rate limiter (middleware)
    roadmap/
      seed/              # one-off tool: seeds curated roadmap trees into Postgres
  migrations/            # SQL migrations, run manually against the database

frontend/
  src/
    components/          # Navbar, UserMenu, layout, shared UI
    pages/                # LandingPage, Login/Register, dashboard, feature pages
    lib/                   # AuthContext, API client
```

## Backend

### Setup

1. Have a Postgres database running (this project uses Supabase).
2. Copy the env template and fill in real values:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Run the migrations in `migrations/` against your database, in order:
   ```bash
   set -a && source .env && set +a
   for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
   ```
4. Start the API:
   ```bash
   go run ./cmd/api
   ```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signing secret for auth tokens |
| `PORT` | Port the API listens on |

### API

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/auth/register` | POST | — | rate limited |
| `/auth/login` | POST | — | rate limited |
| `/auth/logout` | POST | — | |
| `/auth/refresh` | POST | — | rate limited |
| `/auth/me` | GET | Bearer token | |
| `/health` | GET | — | checks DB connectivity |

`profile`'s `GET/PATCH /profile` handlers exist in `internal/profile/transport.go` but aren't mounted in `cmd/api/main.go` yet.

### Seeding roadmap content

`internal/roadmap/seed` holds curated roadmap trees (currently "Backend Software Engineer" and "Cloud Computing") as data, plus the logic to insert them. It's not yet wired as a `cmd/api` subcommand — see `internal/roadmap/seed/seed.go` for the current state.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Routes: `/` (landing page if signed out, dashboard if signed in), `/login`, `/register`, `/consultation`, `/cv-builder`, `/roadmap`, `/practice` (the last four require authentication).
