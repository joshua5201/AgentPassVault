#!/bin/bash
set -euo pipefail

# scripts/management/clear-db.sh
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/docker_compose.sh
source "${SCRIPT_DIR}/../lib/docker_compose.sh"

echo "Dropping AgentPassVault databases..."

# Run mysql inside the container to drop and recreate databases
MYSQL_CONTAINER_ID="$(get_service_container_id mysql)"
docker exec "${MYSQL_CONTAINER_ID}" mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentpassvault_dev; CREATE DATABASE agentpassvault_dev;"
docker exec "${MYSQL_CONTAINER_ID}" mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentpassvault_test; CREATE DATABASE agentpassvault_test;"

echo "Databases cleared successfully."
