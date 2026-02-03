package com.agentvault.repository;

import com.agentvault.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends MongoRepository<User, UUID> {
    Optional<User> findByTenantIdAndUsername(UUID tenantId, String username);
    Optional<User> findByTenantIdAndAppTokenHash(UUID tenantId, String appTokenHash);
}
