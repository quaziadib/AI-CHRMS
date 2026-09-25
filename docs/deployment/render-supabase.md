# Render + Supabase deployment

This Blueprint runs the Next.js frontend, FastAPI backend, Celery worker, and Redis-compatible queue on Render. Supabase hosts PostgreSQL with `pgvector`. All Render services are placed in Singapore.

## 1. Create the Supabase database

1. Create a Supabase project in Singapore and save its database password in a password manager.
2. In **Database → Extensions**, enable the `vector` extension.
3. Open **Connect**, choose **Session pooler**, and copy its connection string. Use the session pooler on port `5432` for this persistent Render app and worker. Keep `sslmode=require`. The URL should resemble:

   ```text
   postgresql://postgres.<project-ref>:<encoded-password>@<pooler-host>:5432/postgres?sslmode=require
   ```

   Use the exact host, username, and URL shown by Supabase. Do not use the transaction pooler on port `6543` for the Render services.

This app uses FastAPI/JWT for authentication and SQLAlchemy for database access. The Supabase Auth/Data API quickstart's `@supabase/ssr` helpers, browser client, project URL, and publishable key are not required for this deployment. Do not add a second frontend auth session unless intentionally migrating authentication to Supabase.

## 2. Create the Render services

Connect this repository to Render as a **Blueprint** and use the repository root `render.yaml`. The Blueprint creates:

| Service | Render type | Purpose |
|---------|-------------|---------|
| `ai-chrms-frontend` | Web service (Docker) | Next.js UI; proxies `/v1/*` to the API |
| `ai-chrms-backend` | Web service (Docker) | FastAPI API and `/health` endpoint |
| `ai-chrms-worker` | Background worker (Docker) | Celery forecast and background jobs |
| `ai-chrms-redis` | Key Value | Celery task broker |

Select **Deploy Blueprint** after entering the requested secrets. If `ai-chrms-backend` already exists from the previous Render configuration, sync the Blueprint to that service rather than creating a second backend. Render does not prompt for new `sync: false` secrets when updating an existing Blueprint service; add any missing secret values in the service's Environment page.

The backend remains a Web Service so it retains its current Render service type. Browser requests use the frontend's same-origin `/v1` rewrite. The API CORS list is empty by default; add the frontend origin if you later call the API directly from a browser on another origin.

## 3. Configure secrets

The Blueprint generates `JWT_SECRET_KEY`. Enter the following values for the backend when prompted, or add them in Render's Environment page:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Session pooler URL from step 1 |
| `ADMIN_EMAIL` | Real email address for the first admin |
| `ADMIN_PASSWORD` | Unique password with at least 16 characters |
| `GROQ_API_KEY` | Newly generated Groq API key |

The worker reads these same values from the backend service. Never put database credentials, JWT secrets, or provider keys in the frontend environment or in Git.

The Blueprint sets `LLM_PROVIDER=groq`, and disables chatbot/RAG until explicitly configured. RAG requires an OpenAI embeddings key in this application; set `OPENAI_API_KEY` and enable `ENABLE_RAG` only if you intend to use it. `NEXT_PUBLIC_DEMO_MODE=false`, `SEED_DEMO_USERS=false`, and `SEED_SYNTHETIC_DATA=false` keep demo accounts and sample patient records out of production.

## 4. Initialize the schema once

The backend deliberately starts with `DB_INIT_ON_STARTUP=false`. After Render has created the services and their environment variables, open the backend service's Shell and run:

```bash
python -m app.db.bootstrap
```

Run this once against the new Supabase database before serving users. It creates the tables and seeds the configured administrator. Do not turn on automatic startup initialization in production. For later schema changes, use a reviewed migration process before deploying code that depends on the new schema.

## 5. Verify the deployment

1. Wait for all four Render services to report healthy/running.
2. Check `https://<backend-service>.onrender.com/health` returns `{"status":"ok",...}`.
3. Open the frontend service URL and sign in with the configured admin email/password.
4. Check a `/v1` API action and submit a background task to confirm the worker and queue are connected.
5. Confirm the Supabase project is receiving connections and that the `vector` extension is enabled.

Set `BACKEND_URL` on the frontend to the backend's Render private-network `hostport`. The Blueprint wires this reference automatically, and `next.config.mjs` adds the `http://` scheme when needed. Render variables are available at build time, so this value is in place when Next.js builds its rewrite rules.

## Production notes

- Render and Supabase are external to each other; the Render services connect to Supabase over TLS using the Session pooler.
- Choose suitable paid Render plans for always-on production services and persistent Key Value storage. Render's free Key Value plan does not persist queue data.
- This app stores sensitive health information. Before adding live patient data, confirm applicable privacy/data-residency obligations, restrict account access, and confirm backup and restore procedures for the selected Supabase plan.
- The Blueprint contains no secret values. Store all credentials in Render's secret environment variables, and rotate any key that has been pasted into chat, logs, or source control.
