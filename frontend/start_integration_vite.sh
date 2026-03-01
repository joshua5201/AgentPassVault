#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export VITE_API_MOCKING="${VITE_API_MOCKING:-false}"
export VITE_API_CLIENT_FALLBACK="${VITE_API_CLIENT_FALLBACK:-false}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:58080}"
export VITE_API_PROXY="${VITE_API_PROXY:-true}"
VITE_HOST="${VITE_HOST:-0.0.0.0}"
VITE_PORT="${VITE_PORT:-5174}"

if ss -ltn | grep -q ":${VITE_PORT} "; then
  echo "Port ${VITE_PORT} is already in use."
  echo "Run with another port: VITE_PORT=5180 ./start_integration_vite.sh"
  exit 1
fi

echo "Starting integration Vite UI..."
echo "  API URL:   ${VITE_API_URL}"
echo "  Web URL:   http://localhost:${VITE_PORT}"

pnpm --filter @agentpassvault/web dev --host "${VITE_HOST}" --port "${VITE_PORT}" --strictPort
