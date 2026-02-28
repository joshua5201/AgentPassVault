/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.repository;

import com.agentpassvault.model.Request;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
  @EntityGraph(attributePaths = {"requester", "tenant", "secret"})
  List<Request> findAllByTenantId(Long tenantId);

  @EntityGraph(attributePaths = {"requester", "tenant", "secret"})
  Optional<Request> findByIdAndTenantId(Long id, Long tenantId);

  @Modifying
  void deleteAllByTenantId(Long tenantId);
}
