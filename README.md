# ur-career

An AI career coach that turns a user's background, goals, and the job market into a personalised, evolving career roadmap. 


## Status

| Module 
|----
| `auth`
| `profile` 
| `resume` 
| `roadmap` 
| `coach` 
| `jobmarket` 

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
