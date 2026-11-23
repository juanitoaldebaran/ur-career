# ur-career

An AI career coach for job-seekers. It combines curated career roadmaps, Gemini-graded practice and quizzes, a streaming chat consultation grounded in the user's profile, and a browser-side CV builder. The target user is someone moving toward a specific role, such as Backend or Cloud Computing. The repo is a monorepo with a Go API in `backend/` and a React SPA in `frontend/`.

## Tech stack

**Backend** (`backend/go.mod`, Go 1.26)
- Go stdlib `net/http` with method-pattern routing, no web framework
- `jackc/pgx/v5` against PostgreSQL (Supabase)
- `golang-jwt/jwt/v5` and `golang.org/x/crypto` for auth
- `redis/go-redis/v9`, optional, for cache and rate limiting
- `joho/godotenv`, `google/uuid`, `golang.org/x/sync` (errgroup)
- Gemini REST API, called directly over `net/http` (no SDK)

**Frontend** (`frontend/package.json`)
- React 19, TypeScript, Vite 8, React Router 7
- Tailwind CSS v4 via `@tailwindcss/vite`, `motion` for animation
- oxlint for linting

**Infra**
- `docker-compose.yml` runs a single `redis:7-alpine` container (no persistence, 128 MB `allkeys-lru`)

## Architecture

```
backend/cmd/api/main.go     entry point and all wiring
backend/internal/<domain>/  repository.go (SQL) → service.go → transport.go (HTTP)
backend/migrations/         0001–0015 numbered SQL files
frontend/src/{pages,components,hooks,lib,data}
```

Backend domains under `internal/`: `auth`, `profile`, `roadmap` (with `seed/`), `practice` (with `ai/`), `consultation`, `quota`, `ratelimit`, `cache`, `httpx`.

**Request flow**
1. `main.go` loads `.env`, connects to Postgres, and optionally connects to Redis.
2. It builds each domain's repository, service and handler, then calls `RegisterRoutes` on one `http.ServeMux`. Protected routes are wrapped with `auth.Handler.Authenticate`.
3. The mux is wrapped in a CORS middleware, and the server shuts down gracefully on SIGINT/SIGTERM.
4. Rate limiting uses Redis when `REDIS_URL` is set and an in-memory store otherwise. Roadmap reads go through a cached repository only when Redis is available.
5. All AI calls go through one `ai.Gemini` client, shared by the quiz generator, the grader and the consultation chat.

**Frontend flow**
- `src/App.tsx` serves `/`, `/login` and `/register` publicly. `/consultation/:id?`, `/cv-builder`, `/roadmap`, `/roadmap/:slug`, `/practice` and `/profile` sit behind `ProtectedRoute`.
- `src/lib/AuthContext.tsx` holds the access and refresh tokens.
- All HTTP goes through `src/lib/api.ts`, which reads `VITE_API_URL`.

## Features

- **Auth**: register, login, logout, refresh and `/auth/me` (`auth/transport.go`). Access tokens last 15 minutes and refresh tokens 30 days, stored hashed. Register, login and refresh are rate-limited to 5 requests per minute per IP.
- **Profile**: `GET/PATCH /profile` and `GET /profile/stats` (`profile/transport.go`): current and target role, skills, and stats for roadmap progress, quizzes, practice and streak.
- **Roadmaps**: `GET /roadmaps`, `GET /roadmap/{slug}` and `PATCH /roadmap/nodes/{id}/progress` (`roadmap/transport.go`). Content is loaded with `go run ./cmd/api seed` (`roadmap/seed/seed.go`) and cached through `roadmap/cached_repository.go`.
- **Practice grading**: `GET /practice/questions` and `POST /practice/questions/{id}/attempts`. `practice/grader.go` (`GeminiGrader.Grade`) scores free-text answers in the `coding` and `system_design` categories.
- **Role quizzes**: `POST /practice/quizzes` and `POST /practice/quizzes/{id}/submit`. Questions come from `practice/quiz_generator.go`, and submission is handled in `practice/quiz_service.go`.
- **Daily streak**: timezone-aware streak tracking in `practice/streak.go`, updated through the quiz service.
- **AI consultation chat**: conversation CRUD plus a streaming `POST /consultations/{id}/messages`, limited to 10 requests per minute per user.
  - `consultation/service.go` keeps the last 12 turns and caps messages at 4000 characters.
  - `consultation/snapshot.go` injects a profile snapshot into the prompt.
  - `practice/ai/gemini_stream.go` does the streaming call.
  - Frontend: `hooks/useChat.ts` and `components/chat/*`.
- **Voice input**: `hooks/useSpeechInput.ts`.
- **CV builder**: `lib/cv.ts` generates LaTeX in the "Jake's Resume" layout and escapes user text. `hooks/useCv.ts` stores the CV in `localStorage` per user, and nothing is sent to the server. The UI is in `components/cv/*`.
- **Health check**: `GET /health` pings the database.

## Local setup

```bash
# Redis (optional; the app runs without it)
docker compose up -d

# Backend: create backend/.env first
#   DATABASE_URL=...  JWT_SECRET=...  PORT=8080
#   GEMINI_API_KEY=...  GEMINI_MODEL=...
#   REDIS_URL=redis://localhost:6379   (optional)
cd backend
# apply backend/migrations/0001–0015 to your Postgres
go run ./cmd/api seed     # load roadmap content, then exit
go run ./cmd/api          # serves on :$PORT

# Frontend
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

Checks before finishing:
- Backend: `go build ./... && go vet ./... && go test ./...`
- Frontend: `npm run build && npm run lint`
