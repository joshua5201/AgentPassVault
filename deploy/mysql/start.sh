#!/bin/bash
# Helper script to fetch secrets from GCE metadata and start MySQL

fetch_metadata() {
  curl -s -f -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/$1"
}

echo "Fetching configuration from GCE metadata..."

export MYSQL_ROOT_PASSWORD=$(fetch_metadata "MYSQL_ROOT_PASSWORD")
export MYSQL_USER=$(fetch_metadata "MYSQL_USER")
export MYSQL_PASSWORD=$(fetch_metadata "MYSQL_PASSWORD")

if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ -z "$MYSQL_USER" ] || [ -z "$MYSQL_PASSWORD" ]; then
  echo "Error: One or more required metadata attributes (MYSQL_ROOT_PASSWORD, MYSQL_USER, MYSQL_PASSWORD) are missing."
  echo "Please set them in the GCP Console under VM Instance -> Edit -> Metadata."
  exit 1
fi

echo "Starting MySQL with metadata-provided credentials..."
docker compose up -d
