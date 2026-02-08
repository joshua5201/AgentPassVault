/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.model.Tenant;
import com.agentpassvault.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantService {

  private final TenantRepository tenantRepository;

  @Transactional
  public Tenant createTenant(String name) {
    Tenant tenant = new Tenant();
    tenant.setName(name);
    tenant.setStatus("ACTIVE");
    return tenantRepository.save(tenant);
  }
}
