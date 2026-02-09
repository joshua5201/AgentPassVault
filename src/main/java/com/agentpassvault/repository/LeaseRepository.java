/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.repository;

import com.agentpassvault.model.Lease;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaseRepository extends JpaRepository<Lease, Long> {
  List<Lease> findBySecret_IdAndAgent_Id(Long secretId, Long agentId);

  List<Lease> findBySecret_Id(Long secretId);

  Optional<Lease> findBySecret_IdAndAgent_IdAndPublicKey(
      Long secretId, Long agentId, String publicKey);

  @Modifying
  @Query("DELETE FROM Lease l WHERE l.secret.tenant.id = :tenantId")
  void deleteAllBySecretTenantId(Long tenantId);
}
