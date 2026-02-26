/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.repository;

import com.agentpassvault.model.Secret;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SecretRepository extends JpaRepository<Secret, Long> {
  @Modifying
  void deleteAllByTenantId(Long tenantId);

  @Query(
      "SELECT s FROM Secret s JOIN FETCH s.tenant WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%')) AND s.tenant.id = :tenantId")
  List<Secret> findByNameContainingIgnoreCaseAndTenantId(String name, Long tenantId);

  @Query(
      value =
          "SELECT * FROM secrets WHERE tenant_id = :tenantId AND JSON_CONTAINS(metadata, CAST(:metadataJson AS JSON))",
      nativeQuery = true)
  List<Secret> findByMetadataAndTenantId(
      @Param("metadataJson") String metadataJson, @Param("tenantId") Long tenantId);

  @Query(
      value =
          "SELECT * FROM secrets "
              + "WHERE tenant_id = :tenantId "
              + "AND LOWER(name) LIKE LOWER(CONCAT('%', :name, '%')) "
              + "AND JSON_CONTAINS(metadata, CAST(:metadataJson AS JSON))",
      nativeQuery = true)
  List<Secret> findByNameAndMetadataAndTenantId(
      @Param("name") String name,
      @Param("metadataJson") String metadataJson,
      @Param("tenantId") Long tenantId);

  @Query("SELECT s FROM Secret s JOIN FETCH s.tenant WHERE s.tenant.id = :tenantId")
  List<Secret> findAllByTenantId(Long tenantId);
}
