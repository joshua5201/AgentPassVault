/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
