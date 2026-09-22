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