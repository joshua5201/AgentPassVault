#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/../.." && pwd)
DOCKER_COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"

compose() {
  docker compose --project-directory "${REPO_ROOT}" -f "${DOCKER_COMPOSE_FILE}" "$@"
}

get_service_container_id() {
  local service_name="$1"
  local container_id
  container_id="$(compose ps -q "${service_name}")"
  if [ -z "${container_id}" ]; then
    echo "No running container found for service '${service_name}'. Start it with: docker compose up -d" >&2
    return 1
  fi
  echo "${container_id}"
}
