#!/bin/bash
# scripts/management/clear-db.sh
echo "Dropping AgentVault databases..."

# Run mysql inside the container to drop and recreate databases
docker exec agentvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentvault; CREATE DATABASE agentvault;"
docker exec agentvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentvault_test; CREATE DATABASE agentvault_test;"

echo "Databases cleared successfully."
