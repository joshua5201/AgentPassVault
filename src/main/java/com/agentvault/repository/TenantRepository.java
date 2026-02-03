package com.agentvault.repository;

import com.agentvault.model.Tenant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TenantRepository extends MongoRepository<Tenant, UUID> {
}
