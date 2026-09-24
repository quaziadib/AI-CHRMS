# Vercel deployment

This repository is configured for one Vercel project with a Next.js frontend service, a FastAPI service, and Celery subscribers backed by Vercel Queues. Supabase provides managed Postgres with `pgvector`; the Vercel Queues broker replaces Redis for forecast jobs.

## Create the Vercel project

1. Import this repository in Vercel and set the project framework to **Services**.
2. Keep the project root at the repository root. The root `vercel.json` builds `frontend/` and `backend/` as separate services and routes `/v1/*` to FastAPI.
3. Set the project Function Region to `sin1` (Singapore). Create the Supabase project in Singapore too, keeping API/database traffic close to users in Bangladesh.
4. In Supabase Database settings, enable the `vector` extension before bootstrapping the schema. Copy the Supavisor pooler connection string into `DATABASE_URL`. Use the transaction pooler on port `6543` for the Vercel API; keep `sslmode=require`. Its username usually includes `postgres.<project-ref>`. Use the direct connection or session pooler for one-off bootstrap/migration commands if transaction pooling causes issues with DDL.
5. Enable Vercel Queues for the project. The Python subscriber configuration in `backend/pyproject.toml` registers the Celery forecast worker; Vercel supplies its broker URL.
6. Add the variables from `.env.production.example` to Vercel's **Production** environment. Generate a fresh `JWT_SECRET_KEY` and `ADMIN_PASSWORD` in your secrets manager. Set a real `ADMIN_EMAIL`. Choose `LLM_PROVIDER=groq` and set `GROQ_API_KEY` to use Groq; `LLM_MODEL` is optional and defaults to `llama-3.3-70b-versatile`. Add the selected provider's key before enabling AI features. Set `NEXT_PUBLIC_DEMO_MODE=false` and `SEED_DEMO_USERS=false` for Preview as well as Production.
7. Before serving users, copy the completed `.env.production` to `backend/.env`, then run `python -m app.db.bootstrap` from `backend/` once. This creates/migrates the schema and seeds the configured admin. Keep `DB_INIT_ON_STARTUP=false` so serverless cold starts do not run DDL or seed work. `.env.production` is a private local file; it does not upload values to Vercel automatically.
8. Deploy. Check the Vercel logs for the FastAPI service and Python subscriber, then verify `/health`, login, and one forecast job.

## Preview deployments

Use a separate Supabase project for previews. Do not point preview deployments at production patient data. Set preview variables independently and keep demo credentials disabled for every public deployment.

## Local Vercel development

After logging in and linking the project, run `vercel env pull .env.local` to obtain local environment values, then use `vercel dev`. Do not commit local env files.

## Important constraints

- Vercel Services and Vercel Queues are beta features. Confirm they are enabled for the Vercel team before connecting production data.
- Database initialization is an explicit one-time command. Run it against the preview Supabase project before production, and do not connect a preview deployment to production patient data.
- Demo logins and sample records are disabled with `SEED_DEMO_USERS=false` and `SEED_SYNTHETIC_DATA=false`; use a new database for the first production deployment.
- Provider API keys are intentionally absent from the example. Keep AI features disabled until valid production keys are installed.
