#!/bin/sh
# Start FastAPI + Next.js together so Render sees $PORT quickly and both
# share one sleep/wake cycle.
set -eu

BACKEND_PORT="${BACKEND_PORT:-8000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
export BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"
export LOG_DIR="${LOG_DIR:-/tmp/logs}"
mkdir -p "${LOG_DIR}"

echo "Starting API on 127.0.0.1:${BACKEND_PORT}…"
cd /app/backend
PYTHONUNBUFFERED=1 uvicorn app.main:app --host 127.0.0.1 --port "${BACKEND_PORT}" --log-level info &
UVICORN_PID=$!

echo "Starting Next.js on 0.0.0.0:${PORT}…"
cd /app/frontend
node server.js &
NODE_PID=$!

cleanup() {
  echo "Shutting down…"
  kill "${NODE_PID}" "${UVICORN_PID}" 2>/dev/null || true
  wait "${NODE_PID}" 2>/dev/null || true
  wait "${UVICORN_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Free instances can take a while to import LangChain / open TLS to Postgres.
i=0
until curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 180 ]; then
    echo "Backend failed to become healthy within 180s" >&2
    if ! kill -0 "${UVICORN_PID}" 2>/dev/null; then
      echo "uvicorn is not running" >&2
      wait "${UVICORN_PID}" || true
    else
      echo "uvicorn is running but /health did not respond" >&2
    fi
    exit 1
  fi
  if ! kill -0 "${UVICORN_PID}" 2>/dev/null; then
    echo "Backend process exited during startup" >&2
    wait "${UVICORN_PID}" || true
    exit 1
  fi
  if ! kill -0 "${NODE_PID}" 2>/dev/null; then
    echo "Frontend process exited during startup" >&2
    wait "${NODE_PID}" || true
    exit 1
  fi
  if [ $((i % 10)) -eq 0 ]; then
    echo "Waiting for API health… (${i}s)"
  fi
  sleep 1
done

echo "API healthy. Waiting on web processes…"
# Prefer keeping the container alive while either child runs; exit if either dies.
while kill -0 "${NODE_PID}" 2>/dev/null && kill -0 "${UVICORN_PID}" 2>/dev/null; do
  sleep 5
done

if ! kill -0 "${UVICORN_PID}" 2>/dev/null; then
  echo "Backend exited unexpectedly" >&2
  wait "${UVICORN_PID}" || true
  exit 1
fi
echo "Frontend exited unexpectedly" >&2
wait "${NODE_PID}" || true
exit 1
