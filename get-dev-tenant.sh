#!/bin/bash

# Extract Tenant ID and Username for "Dev Tenant" from MongoDB
docker exec agentvault-mongodb mongosh agentvault --quiet --eval '
  const tenant = db.tenants.findOne({name: "Dev Tenant"});
  if (tenant) {
    // Convert Binary UUID to standard UUID string format
    const tenantIdHex = tenant._id.toString("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
    print("Tenant ID: " + tenantIdHex);
    
    const user = db.users.findOne({tenantId: tenant._id});
    if (user) {
        print("Username:  " + user.username);
    } else {
        print("Username:  (not found)");
    }
  } else {
    print("Dev Tenant not found. Make sure the application has run in 'dev' profile at least once.");
  }
'