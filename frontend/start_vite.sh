#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

pnpm --filter @agentpassvault/web dev --host 0.0.0.0 --port 5173
