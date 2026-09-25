#!/bin/sh
# Start FastAPI and Next.js in one container so Render Free wakes them together.
set -eu

BACKEND_PORT="${BACKEND_PORT:-8000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
export BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"

cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port "${BACKEND_PORT}" &
UVICORN_PID=$!

cleanup() {
  kill "${UVICORN_PID}" 2>/dev/null || true
  wait "${UVICORN_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait until the API accepts connections (or give up after ~60s).
i=0
until curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "Backend failed to become healthy" >&2
    exit 1
  fi
  # Exit early if uvicorn died
  if ! kill -0 "${UVICORN_PID}" 2>/dev/null; then
    echo "Backend process exited during startup" >&2
    wait "${UVICORN_PID}" || true
    exit 1
  fi
  sleep 1
done

cd /app/frontend
node server.js &
NODE_PID=$!

cleanup_all() {
  kill "${NODE_PID}" 2>/dev/null || true
  cleanup
}
trap cleanup_all EXIT INT TERM

wait "${NODE_PID}"
STATUS=$?
exit "${STATUS}"
