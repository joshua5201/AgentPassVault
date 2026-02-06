#!/bin/bash
# scripts/management/clear-db.sh
echo "Dropping AgentPassVault databases..."

# Run mysql inside the container to drop and recreate databases
docker exec agentpassvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentpassvault_dev; CREATE DATABASE agentpassvault_dev;"
docker exec agentpassvault-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS agentpassvault_test; CREATE DATABASE agentpassvault_test;"

echo "Databases cleared successfully."
