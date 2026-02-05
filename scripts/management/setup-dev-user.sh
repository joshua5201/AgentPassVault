#!/bin/bash

# setup-dev-user.sh

echo "Generating secure configuration..."

# 1. Generate Secrets
SYSTEM_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DEV_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')

# 2. Write to .env file (for local reference or docker-compose usage)
cat <<EOF > .env
AGENTVAULT_SYSTEM_KEY=$SYSTEM_KEY
AGENTVAULT_JWT_SECRET=$JWT_SECRET
AGENTVAULT_DEV_PASSWORD=$DEV_PASSWORD
EOF

echo "----------------------------------------------------------------"
echo "Configuration saved to .env"
echo "----------------------------------------------------------------"
echo "System Key:   $SYSTEM_KEY"
echo "JWT Secret:   $JWT_SECRET"
echo "Dev Password: $DEV_PASSWORD"
echo "----------------------------------------------------------------"
echo ""
echo "To run the application with these credentials:"
echo ""
echo "export AGENTVAULT_SYSTEM_KEY='$SYSTEM_KEY'"
echo "export AGENTVAULT_DEV_PASSWORD='$DEV_PASSWORD'"
echo "# (Note: You also need to set agentvault.jwt.secret in application.properties or via java -D...)"
echo ""
echo "Example command:"
echo "java -Dagentvault.jwt.secret='$JWT_SECRET' -jar build/libs/agentvault-0.0.1-SNAPSHOT.jar"
echo ""