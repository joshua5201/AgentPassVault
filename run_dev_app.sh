#!/bin/bash
set -a
source .env
set +a
./scripts/database/flyway.sh validate
if [ $? -ne 0 ]; then
  echo "Flyway migration is outdated. Run ./scripts/database/flyway.sh migrate"
  exit 1
fi
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
