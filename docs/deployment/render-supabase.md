# Free Render + Supabase deployment

The root `render.yaml` is configured for a low-traffic demo on free tiers: a Next.js web service and FastAPI web service on Render, with Supabase Postgres. It does not create a Celery worker or Redis queue because Render does not offer free background workers. Forecast generation is disabled in this profile. Chatbot and RAG are also disabled.

## Free-tier limits

- Render free web services sleep after 15 minutes without traffic and can take about a minute to wake up. Free instance hours are shared across the workspace, so sustained traffic can exhaust the monthly allowance.
- This profile disables forecasting because forecast jobs require a background worker. It is not a production configuration.
- Supabase Free projects can pause after a period of low database activity. See [Supabase's project pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing).

## 1. Create the Supabase database

1. Create or select a Supabase Free project. Choose Singapore if available.
2. Open **Connect**, choose **Session pooler**, and copy the connection string on port `5432`. Keep `sslmode=require`. It should resemble:

   ```text
   postgresql://postgres.<project-ref>:<encoded-password>@<pooler-host>:5432/postgres?sslmode=require
   ```

3. Use the exact host, username, and URL shown by Supabase.

The app uses FastAPI/JWT and SQLAlchemy for authentication and database access. Supabase Auth's browser client, project URL, and publishable key are not required.

## 2. Create the Render services

Connect this repository to Render as a Blueprint and select the root `render.yaml`. It creates two free web services:

| Service | Purpose |
|---------|---------|
| `ai-chrms-frontend` | Next.js UI; proxies `/v1/*` to the API |
| `ai-chrms-backend` | FastAPI API and `/health` endpoint |

The frontend calls the backend through its public Render URL because free web services cannot receive private-network traffic. The URL is wired into `BACKEND_URL` by the Blueprint.

## 3. Configure the secrets

The Blueprint generates `JWT_SECRET_KEY`. Enter these values when Render prompts for them:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Session pooler URL from step 1 |
| `ADMIN_EMAIL` | Email address for the first admin |
| `ADMIN_PASSWORD` | Unique password with at least 16 characters |

The free profile sets `SEED_DEMO_USERS=false`; demo accounts are not created. Chatbot, RAG, and forecast generation are disabled. Keep all credentials out of Git and chat.

## 4. Initialize the database from your computer

Render's free web services do not provide Shell/SSH access. From the repository, use the backend Python environment and set the same database URL and admin credentials that you entered in Render. A temporary JWT secret is sufficient for this one-time bootstrap; the backend uses Render's generated secret at runtime.

```bash
cd backend
uv sync
export APP_ENV=production
export DEBUG=false
export DB_INIT_ON_STARTUP=false
export SEED_DEMO_USERS=false
export SEED_SYNTHETIC_DATA=false
export DATABASE_URL='paste the Supabase Session pooler URL in your local terminal'
export ADMIN_EMAIL='the admin email entered in Render'
export ADMIN_PASSWORD='the admin password entered in Render'
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
uv run python -m app.db.bootstrap
unset DATABASE_URL ADMIN_EMAIL ADMIN_PASSWORD JWT_SECRET_KEY
```

Run this once against the new database before signing in. Do not enable automatic database initialization in production.

## 5. Deploy and verify

Wait for both services to become healthy, visit the frontend URL, and sign in with the configured admin credentials. The backend health endpoint is `https://<backend-service>.onrender.com/health`.

For a deployment with forecasting, chatbot/RAG, and always-on services, use paid Render plans and restore the worker/queue configuration rather than this free profile.
