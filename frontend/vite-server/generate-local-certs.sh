#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

mkdir -p certs

if [[ -f certs/localhost.crt && -f certs/localhost.key ]]; then
  echo "Certificates already exist in ./certs"
  exit 0
fi

openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -subj "/C=US/ST=Local/L=Local/O=AgentPassVault/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Generated:"
echo "  certs/localhost.crt"
echo "  certs/localhost.key"
