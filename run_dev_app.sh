#!/bin/bash
export MYSQL_PORT_3306=`docker compose port mysql 3306 | cut -d: -f 2`
set +o allexport
source .env
set -o allexport
./scripts/database/flyway.sh validate
if [ $? -ne 0 ]; then
  echo "Flyway migration is outdated. Run ./scripts/database/flyway.sh migrate"
  exit 1
fi
./gradlew bootRun
