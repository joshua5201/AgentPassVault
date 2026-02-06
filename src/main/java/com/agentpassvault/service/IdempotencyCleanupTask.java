/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.repository.IdempotencyRecordRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyCleanupTask {

  private final IdempotencyRecordRepository repository;

  // Run every hour
  @Scheduled(fixedDelay = 3600000)
  @Transactional
  public void cleanup() {
    Instant threshold = Instant.now().minus(24, ChronoUnit.HOURS);
    log.debug("Cleaning up idempotency records older than {}", threshold);
    repository.deleteByCreatedAtBefore(threshold);
  }
}
