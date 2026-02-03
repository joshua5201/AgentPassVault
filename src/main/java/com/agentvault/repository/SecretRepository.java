package com.agentvault.repository;

import com.agentvault.model.Secret;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecretRepository extends MongoRepository<Secret, String> {}
