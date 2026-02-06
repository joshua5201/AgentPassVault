#!/bin/bash
docker compose exec flyway flyway -url="jdbc:mysql://mysql:3306/agentvault_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" -user=root -password=root $1
DEV_EXIT_STATUS=$?

if [ $DEV_EXIT_STATUS -ne 0 ]; then
  echo "Failed to run flyway for dev database"
fi

docker compose exec flyway flyway -url="jdbc:mysql://mysql:3306/agentvault_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" -user=root -password=root $1
TEST_EXIT_STATUS=$?

if [ $TEST_EXIT_STATUS -ne 0 ]; then
  echo "Failed to run flyway for test database"
fi

if [ $DEV_EXIT_STATUS -gt $TEST_EXIT_STATUS ]; then
  exit $DEV_EXIT_STATUS
else
  exit $TEST_EXIT_STATUS
fi