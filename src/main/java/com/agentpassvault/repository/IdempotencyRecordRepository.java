/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.repository;

import com.agentpassvault.model.IdempotencyRecord;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String> {
  void deleteByCreatedAtBefore(Instant threshold);

  @Modifying
  @Query("DELETE FROM IdempotencyRecord ir WHERE ir.id LIKE :prefix%")
  void deleteByIdStartingWith(String prefix);
}
