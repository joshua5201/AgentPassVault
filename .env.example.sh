#!/bin/bash

# Generate a 32-byte (256-bit) random key and Base64 encode it:
# openssl rand -base64 32
export AGENTVAULT_SYSTEM_KEY=""

# Generate another 32-byte random key and Base64 encode it:
# openssl rand -base64 32
export AGENTVAULT_JWT_SECRET=""

# Generate a 12-character random password:
# openssl rand -base64 12
export AGENTVAULT_DEV_PASSWORD=""
