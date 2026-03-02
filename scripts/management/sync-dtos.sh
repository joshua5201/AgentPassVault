#!/bin/bash
set -e

# 1. Generate openapi.yaml from Java
echo "Generating openapi.yaml from Java code..."
# Dummy token just to make Jwt beans work
export AGENTPASSVAULT_JWT_SECRET=598bfbad7911a05fae2b860b22daeffb697588be272e45e79e7306afb0f0f1bda6729b78ed5cd5105c0994bb1756282dedda89affd44a0aaadf9c666bcb34542
./gradlew generateOpenApiDocs

# 2. Generate TypeScript DTOs from openapi.yaml
echo "Generating TypeScript DTOs from openapi.yaml..."
cd frontend
pnpm gen-dtos

echo "DTO synchronization complete!"
