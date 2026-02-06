/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import com.agentpassvault.model.IdempotencyRecord;
import com.agentpassvault.repository.IdempotencyRecordRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

  private final IdempotencyRecordRepository repository;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String method = request.getMethod();
    if (!"POST".equalsIgnoreCase(method) && !"PATCH".equalsIgnoreCase(method)) {
      filterChain.doFilter(request, response);
      return;
    }

    String idempotencyKey = request.getHeader("Idempotency-Key");
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      filterChain.doFilter(request, response);
      return;
    }

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (!(auth instanceof AgentPassVaultAuthentication agentAuth)) {
      filterChain.doFilter(request, response);
      return;
    }

    String tenantId = agentAuth.getTenantId().toString();
    String recordId = tenantId + ":" + idempotencyKey;

    Optional<IdempotencyRecord> existing = repository.findById(recordId);
    if (existing.isPresent()) {
      IdempotencyRecord record = existing.get();
      response.setStatus(record.getResponseStatus());
      response.setContentType("application/json");
      response.getWriter().write(record.getResponseBody());
      response.getWriter().flush();
      return;
    }

    ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
    try {
      filterChain.doFilter(request, responseWrapper);

      // Store the response if successful (2xx)
      int status = responseWrapper.getStatus();
      if (status >= 200 && status < 300) {
        String responseBody =
            new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
        IdempotencyRecord record =
            new IdempotencyRecord(recordId, responseBody, status, Instant.now());
        repository.save(record);
      }

      responseWrapper.copyBodyToResponse();
    } finally {
      // Cleanup handled by wrapper
    }
  }
}
