#!/bin/bash
# scripts/management/clear-db.sh

# Get MySQL port from environment or default to 3306
PORT=${MYSQL_PORT_3306:-3306}

echo "Clearing AgentVault databases..."

# Run mysql inside the container to drop and recreate databases
docker exec agentvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentvault; CREATE DATABASE agentvault;"
docker exec agentvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentvault_test; CREATE DATABASE agentvault_test;"

echo "Databases cleared successfully."