# Free Render + Supabase deployment

The root `render.yaml` deploys **one** free web service (`ai-chrms`) that runs Next.js and FastAPI in the same container. They share one sleep/wake cycle so the UI and API always come up together. Forecast/chatbot/RAG stay disabled (no free workers).

## Free-tier limits

- The combined service still sleeps after ~15 minutes idle and can take about a minute to wake. Free instance hours are shared across the workspace.
- Split frontend/backend free services are **not** recommended: the UI can wake while the API is still cold.
- Supabase Free projects can pause after low database activity. See [Supabase's project pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing).

## 0. Replace old split services (if you already deployed two)

If you still have `ai-chrms-frontend` and `ai-chrms-backend`:

1. Render Dashboard → delete both services (and the old Blueprint if any).
2. Create a new Blueprint from this repo’s `render.yaml` (service name `ai-chrms`).
3. Re-enter `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `GROQ_API_KEY`.

## 1. Create the Supabase database

1. Create or select a Supabase Free project. Choose Singapore if available.
2. Open **Connect**, choose **Session pooler**, and copy the connection string on port `5432`. Keep `sslmode=require`. It should resemble:

   ```text
   postgresql://postgres.<project-ref>:<encoded-password>@<pooler-host>:5432/postgres?sslmode=require
   ```

3. Use the exact host, username, and URL shown by Supabase.

The app uses FastAPI/JWT and SQLAlchemy for authentication and database access. Supabase Auth's browser client, project URL, and publishable key are not required.

## 2. Create the Render service

Connect this repository to Render as a Blueprint and select the root `render.yaml`. It creates:

| Service | Purpose |
|---------|---------|
| `ai-chrms` | Next.js UI + FastAPI on one free instance |

Public URL looks like `https://ai-chrms.onrender.com`. Browser calls `/v1/*` on the same origin; Next proxies to FastAPI on `127.0.0.1:8000` inside the container.

## 3. Configure the secrets

The Blueprint generates `JWT_SECRET_KEY`. Enter these values when Render prompts for them:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Session pooler URL from step 1 |
| `ADMIN_EMAIL` | Email address for the first admin |
| `ADMIN_PASSWORD` | Unique password with at least 16 characters |
| `GROQ_API_KEY` | Groq API key (risk scoring) |

Keep credentials out of Git and chat. `LLM_PROVIDER` / `LLM_MODEL` default to Groq `openai/gpt-oss-120b`.

## 4. Initialize the database from your computer

Render's free web services do not provide Shell/SSH access. From the repository, use the backend Python environment and set the same database URL (and demo seed flags if you want demo logins).

```bash
cd backend
uv sync
export APP_ENV=development
export DATABASE_URL='paste the Supabase Session pooler URL in your local terminal'
export ADMIN_EMAIL='admin@health.local'
export ADMIN_PASSWORD='admin123'
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
export SEED_DEMO_USERS=true
export SEED_SYNTHETIC_DATA=true
uv run python -m app.db.bootstrap
unset DATABASE_URL ADMIN_EMAIL ADMIN_PASSWORD JWT_SECRET_KEY
```

On the Render service, keep `SEED_DEMO_USERS=false` and `DB_INIT_ON_STARTUP=false` so the process can start; demo users come from this one-time bootstrap.

## 5. Deploy and verify

Wait for `ai-chrms` to become healthy, open the service URL, and sign in (e.g. `demo@health.local` / `demo123` after seeding). Health: `https://<service>.onrender.com/health`.

Optional: `.github/workflows/keep-render-awake.yml` pings the service every 12 minutes to reduce cold starts (uses free hours).

For forecasting, chatbot/RAG, and always-on, use paid Render plans rather than this free profile.
