/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

/**
 * A simple context object holding the Tenant ID. This object is designed to be passed explicitly to
 * service methods, avoiding reliance on thread-local storage.
 */
public record TenantContext(Long tenantId) {
  public TenantContext {
    if (tenantId == null) {
      throw new IllegalArgumentException("TenantContext requires a non-null tenantId");
    }
  }
}
