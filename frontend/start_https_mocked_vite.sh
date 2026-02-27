#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

CERT_DIR="./vite-proxy/certs"
CERT_FILE="${CERT_DIR}/localhost.crt"
KEY_FILE="${CERT_DIR}/localhost.key"
ABS_CERT_FILE="$(pwd)/vite-proxy/certs/localhost.crt"
ABS_KEY_FILE="$(pwd)/vite-proxy/certs/localhost.key"
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required but not found."
  echo "Install openssl, then rerun this script."
  exit 1
fi

mkdir -p "${CERT_DIR}"

NEEDS_CERT_GEN="false"
if [[ ! -f "${CERT_FILE}" || ! -f "${KEY_FILE}" ]]; then
  NEEDS_CERT_GEN="true"
elif [[ -n "${LAN_IP}" ]] && ! openssl x509 -in "${CERT_FILE}" -noout -text | grep -q "IP Address:${LAN_IP}"; then
  NEEDS_CERT_GEN="true"
fi

if [[ "${NEEDS_CERT_GEN}" == "true" ]]; then
  echo "Generating stable self-signed certificate for localhost..."
  SAN="subjectAltName=DNS:localhost,IP:127.0.0.1"
  if [[ -n "${LAN_IP}" ]]; then
    SAN="${SAN},IP:${LAN_IP}"
  fi
  openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=US/ST=Local/L=Local/O=AgentPassVault/CN=localhost" \
    -addext "${SAN}"
  echo "Generated certificate: ${CERT_FILE}"
fi

export VITE_API_MOCKING="${VITE_API_MOCKING:-true}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"
export VITE_DEV_HTTPS="true"
export VITE_DEV_HTTPS_CERT="${ABS_CERT_FILE}"
export VITE_DEV_HTTPS_KEY="${ABS_KEY_FILE}"
VITE_HOST="${VITE_HOST:-0.0.0.0}"
VITE_PORT="${VITE_PORT:-5173}"

if ss -ltn | grep -q ":${VITE_PORT} "; then
  echo "Port ${VITE_PORT} is already in use."
  echo "Stop the process using this port (for example: cd frontend/vite-proxy && docker compose down)"
  echo "Or run with another port: VITE_PORT=5175 ./start_https_mocked_vite.sh"
  exit 1
fi

echo "Starting Vite HTTPS mock UI..."
echo "  Local URL: https://localhost:${VITE_PORT}"
if [[ -n "${LAN_IP}" ]]; then
  echo "  LAN URL:   https://${LAN_IP}:${VITE_PORT}"
fi
pnpm --filter @agentpassvault/web dev --host "${VITE_HOST}" --port "${VITE_PORT}" --strictPort
