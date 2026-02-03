#!/bin/bash

# Extract Tenant ID for "Dev Tenant" from MongoDB (handling Binary UUID)
TENANT_ID=$(docker exec agentvault-mongodb mongosh agentvault --quiet --eval '
  const tenant = db.tenants.findOne({name: "Dev Tenant"});
  if (tenant) {
    print(tenant._id.toString("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5"));
  }
')

if [ -n "$TENANT_ID" ]; then
  echo "Dev Tenant ID: $TENANT_ID"
else
  echo "Dev Tenant not found. Make sure the application has run in 'dev' profile at least once."
fi
