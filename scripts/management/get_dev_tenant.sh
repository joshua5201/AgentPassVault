#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/docker_compose.sh
source "${SCRIPT_DIR}/../lib/docker_compose.sh"

# Extract Tenant ID and Username for "Dev Tenant" from MySQL
# Using -N to remove headers and -s for silent mode
MYSQL_CONTAINER_ID="$(get_service_container_id mysql)"
RESULT=$(docker exec "${MYSQL_CONTAINER_ID}" mysql -uroot -proot -s -N -e "
  USE agentpassvault_dev;
  SELECT t.id, u.username 
  FROM tenants t 
  LEFT JOIN users u ON t.id = u.tenant_id 
  WHERE t.name = 'Dev Tenant' 
  LIMIT 1;
")

if [ -n "$RESULT" ]; then
    TENANT_ID=$(echo $RESULT | awk '{print $1}')
    USERNAME=$(echo $RESULT | awk '{print $2}')
    echo "Tenant ID: $TENANT_ID"
    echo "Username:  $USERNAME"
else
    echo "Dev Tenant not found. Make sure the application has run in \"dev\" profile at least once."
fi
