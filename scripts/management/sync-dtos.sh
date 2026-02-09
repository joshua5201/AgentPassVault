#!/bin/bash
set -e

# 1. Generate openapi.yaml from Java
echo "Generating openapi.yaml from Java code..."
./gradlew generateOpenApiDocs

# 2. Generate TypeScript DTOs from openapi.yaml
echo "Generating TypeScript DTOs from openapi.yaml..."
cd frontend
pnpm gen-dtos

echo "DTO synchronization complete!"
