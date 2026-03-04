#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=../lib/docker_compose.sh
source "${SCRIPT_DIR}/../lib/docker_compose.sh"

MYSQL_CONTAINER_ID="$(get_service_container_id mysql)"
docker exec -it "${MYSQL_CONTAINER_ID}" mysql -proot -u root
