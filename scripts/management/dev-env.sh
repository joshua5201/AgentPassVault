#!/bin/bash
# Starts the development environment

# Default port if not set
export MONGODB_PORT_27017=${MONGODB_PORT_27017:-27017}

echo "Starting MongoDB on 127.0.0.1:$MONGODB_PORT_27017..."
docker compose up -d
