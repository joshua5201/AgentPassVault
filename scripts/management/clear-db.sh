#!/bin/bash
# scripts/management/clear-db.sh

# Get MongoDB port from environment or default to 27017
PORT=${MONGODB_PORT_27017:-27017}

echo "Clearing AgentVault databases..."

# Run mongosh inside the container to drop databases
docker exec agentvault-mongodb mongosh --port $PORT --eval "db.getSiblingDB('agentvault').dropDatabase()"
docker exec agentvault-mongodb mongosh --port $PORT --eval "db.getSiblingDB('agentvault_test').dropDatabase()"

echo "Databases cleared successfully."
