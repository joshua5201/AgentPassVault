#!/bin/bash

# Extract Tenant ID and Username for "Dev Tenant" from MySQL
# Using -N to remove headers and -s for silent mode
RESULT=$(docker exec agentvault-mysql mysql -uroot -proot -s -N -e "
  USE agentvault_dev;
  SELECT t.id, u.username 
  FROM tenants t 
  LEFT JOIN users u ON t.id = u.tenant_id 
  WHERE t.name = 'Dev Tenant' 
  LIMIT 1;
")

if [ -n "$RESULT" ]; then
    TENANT_ID=$(echo $RESULT | awk '{print $1}')
    USERNAME=$(echo $RESULT | awk '{print $2}')
    echo "Tenant ID: $TENANT_ID"
    echo "Username:  $USERNAME"
else
    echo "Dev Tenant not found. Make sure the application has run in \"dev\" profile at least once."
fi
