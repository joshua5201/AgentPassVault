/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.repository;

import com.agentpassvault.model.Role;
import com.agentpassvault.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByUsername(String username);

  Optional<User> findByTenant_IdAndAppTokenHash(Long tenantId, String appTokenHash);

  Optional<User> findByResetPasswordToken(String resetPasswordToken);

  List<User> findByTenant_IdAndRole(Long tenantId, Role role);
}
