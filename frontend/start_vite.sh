#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-real}"
VITE_HOST="${VITE_HOST:-0.0.0.0}"

case "${MODE}" in
  mocked)
    export VITE_API_MOCKING="${VITE_API_MOCKING:-true}"
    export VITE_API_CLIENT_FALLBACK="${VITE_API_CLIENT_FALLBACK:-true}"
    export VITE_API_PROXY="${VITE_API_PROXY:-false}"
    export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"
    VITE_PORT="${VITE_PORT:-5173}"
    ;;
  real)
    export VITE_API_MOCKING="${VITE_API_MOCKING:-false}"
    export VITE_API_CLIENT_FALLBACK="${VITE_API_CLIENT_FALLBACK:-false}"
    export VITE_API_PROXY="${VITE_API_PROXY:-true}"
    export VITE_API_URL="${VITE_API_URL:-${AGENTPASSVAULT_API_URL:-https://api-staging.agentpassvault.com}}"
    VITE_PORT="${VITE_PORT:-5173}"
    ;;
  *)
    echo "Usage: ./start_vite.sh [mocked|real]"
    echo "  mocked: run UI with local API mocking"
    echo "  real:   run UI against backend API (default staging)"
    exit 1
    ;;
esac

export VITE_DEV_HTTPS="${VITE_DEV_HTTPS:-true}"

if [[ "${VITE_DEV_HTTPS}" == "true" ]]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "openssl is required when HTTPS is enabled."
    echo "Disable HTTPS with: VITE_DEV_HTTPS=false ./start_vite.sh ${MODE}"
    exit 1
  fi

  CERT_DIR="./vite-server/certs"
  CERT_FILE="${VITE_DEV_HTTPS_CERT:-${CERT_DIR}/localhost.crt}"
  KEY_FILE="${VITE_DEV_HTTPS_KEY:-${CERT_DIR}/localhost.key}"

  mkdir -p "$(dirname "${CERT_FILE}")"
  mkdir -p "$(dirname "${KEY_FILE}")"

  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  NEEDS_CERT_GEN="false"
  if [[ ! -f "${CERT_FILE}" || ! -f "${KEY_FILE}" ]]; then
    NEEDS_CERT_GEN="true"
  elif [[ -n "${LAN_IP}" ]] && ! openssl x509 -in "${CERT_FILE}" -noout -text | grep -q "IP Address:${LAN_IP}"; then
    NEEDS_CERT_GEN="true"
  fi

  if [[ "${NEEDS_CERT_GEN}" == "true" ]]; then
    SAN="subjectAltName=DNS:localhost,IP:127.0.0.1"
    if [[ -n "${LAN_IP}" ]]; then
      SAN="${SAN},IP:${LAN_IP}"
    fi
    openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes \
      -keyout "${KEY_FILE}" \
      -out "${CERT_FILE}" \
      -subj "/C=US/ST=Local/L=Local/O=AgentPassVault/CN=localhost" \
      -addext "${SAN}" >/dev/null 2>&1
  fi

  CERT_PATH="${CERT_FILE}"
  KEY_PATH="${KEY_FILE}"
  if [[ "${CERT_PATH}" != /* ]]; then
    CERT_PATH="$(pwd)/${CERT_PATH}"
  fi
  if [[ "${KEY_PATH}" != /* ]]; then
    KEY_PATH="$(pwd)/${KEY_PATH}"
  fi
  export VITE_DEV_HTTPS_CERT="${CERT_PATH}"
  export VITE_DEV_HTTPS_KEY="${KEY_PATH}"
fi

if ss -ltn | grep -q ":${VITE_PORT} "; then
  echo "Port ${VITE_PORT} is already in use."
  echo "Run with another port: VITE_PORT=5175 ./start_vite.sh ${MODE}"
  exit 1
fi

SCHEME="http"
if [[ "${VITE_DEV_HTTPS}" == "true" ]]; then
  SCHEME="https"
fi

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "Starting Vite UI (${MODE})..."
echo "  Web URL:   ${SCHEME}://localhost:${VITE_PORT}"
if [[ -n "${LAN_IP}" ]]; then
  echo "  LAN URL:   ${SCHEME}://${LAN_IP}:${VITE_PORT}"
fi
echo "  API URL:   ${VITE_API_URL}"
echo "  Mocking:   ${VITE_API_MOCKING}"
echo "  API Proxy: ${VITE_API_PROXY}"
echo "  HTTPS:     ${VITE_DEV_HTTPS}"

pnpm --filter @agentpassvault/web dev --host "${VITE_HOST}" --port "${VITE_PORT}" --strictPort
