# ur-career

AI career coach: turns a user's background, goals and the job market into a personalised career roadmap. Monorepo with a Go API (`backend/`) and a React SPA (`frontend/`).

## Commands

Backend (run from `backend/`):
- `go run ./cmd/api` — start the API (default port from `PORT`, frontend expects `:8080`)
- `go run ./cmd/api seed` — seed roadmap content, then exit
- `go build ./... && go vet ./... && go test ./...` — check before finishing

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (the type check; run it after UI changes)
- `npm run lint` — oxlint

Infra: `docker compose up -d` starts Redis (cache and rate limiting only; the app must still run without it).

Env: backend reads `DATABASE_URL`, `JWT_SECRET`, `PORT`, `REDIS_URL` (optional), `GEMINI_API_KEY`, `GEMINI_MODEL` via `.env`. Frontend uses `VITE_API_URL`. Never commit `.env` files or print secrets.

## Backend architecture

Go stdlib `net/http` with method-pattern routing (`mux.HandleFunc("GET /path", ...)`), `pgx/v5` against Postgres (Supabase), no web framework.

- One package per domain under `backend/internal/` (`auth`, `profile`, `roadmap`, `practice`, `quota`, `ratelimit`, `cache`, `httpx`).
- Each domain follows the same layering: `repository.go` (SQL) → `service.go` (business logic) → `transport.go` (HTTP handler, `RegisterRoutes`). Keep that split; handlers don't touch SQL and repositories don't know about HTTP.
- All wiring happens in `backend/cmd/api/main.go`. A new module isn't live until it's registered there.
- Protected routes take `handler.Authenticate` from `auth`.
- Shared response/error helpers live in `internal/httpx`; use them instead of ad-hoc JSON writing.
- Caching goes through the `cache.Cache` interface; Redis is optional and the code degrades to no cache / in-memory rate limiting.
- Gemini calls are isolated in `practice/ai`. Grading and quiz generation live in `practice/`.
- Migrations: numbered SQL files in `backend/migrations/` (`0013_...sql` is next). Never edit an applied migration; add a new one.

Note: `README.md`'s status table is out of date (profile and practice are wired). Trust `main.go` over the README.

## Frontend architecture

React 19 + TypeScript, React Router 7, Tailwind CSS v4 (via `@tailwindcss/vite`), `motion` for animation.

- `src/pages/` route-level screens, `src/components/` shared pieces, `src/lib/` API client and auth context, `src/data/` static content.
- All API calls go through `src/lib/api.ts`; don't scatter `fetch` calls in components.
- Design tokens live in `src/index.css` (`@theme`) with shared classes (`.btn`, `.btn-primary`, `.btn-ghost`, `.input`, `.chip`, `.eyebrow`). Reuse them; extend the tokens instead of hardcoding new hex values in components.
- Existing components to reuse before writing new ones: `TextField`, `PasswordField`, `Spinner`, `ScoreRing`, `AuthShell`, `Logo`.

## UI design rules: no AI slop

The existing look is deliberate: one white canvas, near-black ink (`--color-ink`), a single blue accent (`--color-brand`), Bricolage Grotesque for headings, Figtree for body, JetBrains Mono for small labels. New UI must look like it belongs to this product, not like generic generated output.

Do not:
- Add purple/indigo-to-pink gradients, gradient text, glowing blobs, or mesh backgrounds.
- Add a second accent colour, or any colour that isn't a token.
- Wrap everything in rounded cards with soft shadows. Use a card only when grouping needs it; prefer whitespace, hairline borders (`--color-line`) and alignment.
- Use emoji as icons or bullets, or sparkle/"✨" iconography to signal AI.
- Use a row of three identical icon-in-a-circle feature cards, or centered-hero-plus-two-buttons as the default layout for every screen.
- Write filler copy: "Unlock your potential", "Supercharge", "Seamless", "Elevate", "Empower", "Leverage", "Revolutionize", "Your journey starts here". No lorem ipsum, no fake testimonials, no invented stats or logos.
- Animate for decoration. No bouncing, floating, pulsing, or scroll-jacking. Motion must explain a state change, and must respect `useReducedMotion` / `prefers-reduced-motion` (the Navbar shows the pattern).
- Introduce new fonts, icon libraries or UI kits without asking.
- Pile on badges, pills and tooltips. Chips are for real categories or status.

Do:
- Write specific, plain copy that says what the thing does for a job-seeker. Use sentence case. Prefer concrete nouns (roadmap node, quiz score, target role) over abstractions.
- Build real states for every data view: loading (`Spinner` or skeleton matching the layout), empty (says what to do next), error (says what failed and offers retry). Don't ship happy-path only.
- Keep a clear hierarchy: one primary action per view (`btn-primary`), secondary actions as `btn-ghost`.
- Keep forms accessible: visible labels (not placeholder-only), inline errors tied to fields, keyboard operable, `:focus-visible` outlines intact.
- Check layout at mobile width as well as desktop. Check contrast of any grey text against white.
- Use semantic HTML (`button` for actions, `a`/`Link` for navigation, real headings in order).
- Show real data from the API where it exists. Where it doesn't, say so rather than faking it.

Before calling UI work done: run `npm run build` and `npm run lint`, then look at it in the browser (`npm run dev`) at both a narrow and a wide viewport. Type-checking passing does not mean the UI is right.

## Working conventions

- Keep changes small and in the style of the surrounding code. Don't refactor unrelated files.
- Match existing naming and error-handling patterns in the package you're editing before inventing new ones.
- Don't add dependencies without asking.
- Commit messages in this repo are short, lowercase, imperative-ish (e.g. "improve the roadmap"). Only commit when asked.
