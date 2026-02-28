#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export VITE_API_MOCKING="${VITE_API_MOCKING:-false}"
export VITE_API_CLIENT_FALLBACK="${VITE_API_CLIENT_FALLBACK:-false}"
export VITE_API_URL="${VITE_API_URL:-https://api-staging.agentpassvault.com}"
VITE_HOST="${VITE_HOST:-0.0.0.0}"
VITE_PORT="${VITE_PORT:-5175}"

if ss -ltn | grep -q ":${VITE_PORT} "; then
  echo "Port ${VITE_PORT} is already in use."
  echo "Run with another port: VITE_PORT=5181 ./start_staging_vite.sh"
  exit 1
fi

echo "Starting staging Vite UI..."
echo "  API URL:   ${VITE_API_URL}"
echo "  Web URL:   http://localhost:${VITE_PORT}"

pnpm --filter @agentpassvault/web dev --host "${VITE_HOST}" --port "${VITE_PORT}" --strictPort
