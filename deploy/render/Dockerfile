# Single Render Free web service: Next.js + FastAPI in one container.
# They share one sleep/wake cycle so the UI never outlives a cold API.

# ---------- frontend build ----------
FROM node:22-bookworm-slim AS frontend-deps
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts

FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /frontend
COPY --from=frontend-deps /frontend/node_modules ./node_modules
COPY frontend/ .
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
# Same-container API — baked into Next rewrites at build time
ENV BACKEND_URL=http://127.0.0.1:8000
RUN ./node_modules/.bin/next build

# ---------- final image ----------
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    ca-certificates \
    gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend deps + code
COPY backend/pyproject.toml backend/uv.lock ./backend/
WORKDIR /app/backend
RUN pip install --no-cache-dir uv \
  && uv pip install --system --no-cache -r pyproject.toml
COPY backend/app ./app

# Frontend standalone
WORKDIR /app
COPY --from=frontend-builder /frontend/public ./frontend/public
COPY --from=frontend-builder /frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /frontend/.next/static ./frontend/.next/static

COPY deploy/render/start.sh /app/start.sh
RUN chmod +x /app/start.sh \
  && adduser --disabled-password --gecos '' appuser \
  && chown -R appuser:appuser /app

USER appuser

# Render sets PORT; Next listens on it. API stays on loopback :8000.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV BACKEND_URL=http://127.0.0.1:8000
ENV LOG_DIR=/tmp/logs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

CMD ["/app/start.sh"]
