#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Base parameters
DB_HOST="127.0.0.1"
DB_PORT="53306"
DB_USER="root"
DB_PASS="root"

echo "Running Flyway Migration for Dev Database (agentpassvault_dev)..."
./gradlew flywayMigrate \
  -PdbUrl="jdbc:mysql://${DB_HOST}:${DB_PORT}/agentpassvault_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -PdbUser="${DB_USER}" \
  -PdbPassword="${DB_PASS}"

echo "Running Flyway Migration for Test Database (agentpassvault_test)..."
./gradlew flywayMigrate \
  -PdbUrl="jdbc:mysql://${DB_HOST}:${DB_PORT}/agentpassvault_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -PdbUser="${DB_USER}" \
  -PdbPassword="${DB_PASS}"

echo "Flyway migrations completed successfully!"