/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.config.VaultUiProperties;
import com.agentpassvault.model.Request;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FulfillmentUrlService {

  private final VaultUiProperties uiProperties;

  public String generate(Request request) {
    // e.g., https://vault.local/requests/tsid...
    return uiProperties.baseUrl() + uiProperties.fulfillmentPath() + request.getId();
  }
}
