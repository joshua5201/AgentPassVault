#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export VITE_API_MOCKING="${VITE_API_MOCKING:-true}"
export VITE_API_CLIENT_FALLBACK="${VITE_API_CLIENT_FALLBACK:-true}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"
VITE_HOST="${VITE_HOST:-0.0.0.0}"
VITE_PORT="${VITE_PORT:-5173}"

if ss -ltn | grep -q ":${VITE_PORT} "; then
  echo "Port ${VITE_PORT} is already in use."
  echo "Run with another port: VITE_PORT=5175 ./start_pure_ui_mock_vite.sh"
  exit 1
fi

echo "Starting pure UI mock Vite..."
echo "  Mocking:   ${VITE_API_MOCKING}"
echo "  Web URL:   http://localhost:${VITE_PORT}"

pnpm --filter @agentpassvault/web dev --host "${VITE_HOST}" --port "${VITE_PORT}" --strictPort
