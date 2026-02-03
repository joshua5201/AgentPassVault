package com.agentvault.security;

import java.util.UUID;

/**
 * A simple context object holding the Tenant ID. This object is designed to be passed explicitly to
 * service methods, avoiding reliance on thread-local storage.
 */
public record TenantContext(UUID tenantId) {
  public TenantContext {
    if (tenantId == null) {
      throw new IllegalArgumentException("TenantContext requires a non-null tenantId");
    }
  }
}
