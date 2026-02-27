#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export VITE_API_MOCKING="true"
export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"
VITE_PORT="${VITE_PORT:-5173}"

pnpm --filter @agentpassvault/web dev --host 0.0.0.0 --port "${VITE_PORT}"
