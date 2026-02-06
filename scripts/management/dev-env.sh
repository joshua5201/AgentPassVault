#!/bin/bash
# Starts the development environment

# Default port if not set
export MYSQL_PORT_3306=${MYSQL_PORT_3306:-3306}

echo "Starting MySQL on 127.0.0.1:$MYSQL_PORT_3306..."
docker compose up -d