package com.agentvault.service;

import com.agentvault.config.VaultUiProperties;
import com.agentvault.model.Request;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FulfillmentUrlService {

  private final VaultUiProperties uiProperties;

  public String generate(Request request) {
    // e.g., https://vault.local/requests/uuid...
    return uiProperties.baseUrl() + uiProperties.fulfillmentPath() + request.getRequestId();
  }
}
