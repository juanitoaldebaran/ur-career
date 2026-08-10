# ur-career

An AI career coach that turns a user's background, goals, and the job market into a personalised, evolving career roadmap.

## Stack

- **Frontend** — React + TypeScript *(not yet scaffolded)*
- **Backend** — Go, stdlib `net/http` (method-pattern routing), `pgx/v5`
- **Database** — PostgreSQL

## Status

| Module | Status |
|---|---|
| `auth` — signup, login, JWT | in progress |
| `profile` | not started |
| `resume` | not started |
| `roadmap` | not started |
| `coach` (AI orchestrator) | not started |
| `jobmarket` | not started |
| frontend | not started |

## Backend

```
backend/
  cmd/api/          # entrypoint
  internal/auth/     # signup, login, JWT issuance
  migrations/        # SQL migrations
```

### Setup

1. Have a Postgres database running.
2. Copy the env template and fill in real values:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Run the migration in `migrations/` against your database.
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

| Endpoint | Method | Auth |
|---|---|---|
| `/auth/register` | POST | — |
| `/auth/login` | POST | — |
| `/auth/me` | GET | Bearer token |
