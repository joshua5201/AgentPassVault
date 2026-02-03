# Implementation Plan - AgentVault

This document outlines the step-by-step implementation plan for the AgentVault system, based on the specifications in `DESIGN.md`.

## Phase 1: Foundation & Configuration
- [x] **Project Structure**: Verify package layout (`com.agentvault`).
- [x] **Database Config**: Configure MongoDB connection details in `application.properties`.
- [x] **Security Config Stub**: Create a basic `SecurityConfig` to allow development (initially permissive, then locked down).
- [x] **Global Exception Handling**: Set up `GlobalExceptionHandler` for consistent API error responses.

## Phase 2: Domain Models (Data Layer)
Define MongoDB documents with Lombok annotations.
- [x] **Tenant**: `_id`, `name`, `encrypted_tenant_key`, `status`.
- [x] **User**: `_id`, `tenant_id`, `username`, `password_hash`, `role`.
- [x] **Secret**: `_id`, `tenant_id`, `name`, `encrypted_value`, `nonce`, `tag`, `metadata` (flexible).
- [x] **Request**: `_id`, `request_id`, `tenant_id`, `status`, `name`, `required_metadata`, `rejection_reason`.
- [x] **Repositories**: Create `MongoRepository` interfaces for each document.

## Phase 3: Cryptography & Key Management
This is the core security layer.
- [ ] **KeyManagementService**:
    - [ ] Load `AGENTVAULT_SYSTEM_KEY` (SMK) from environment.
    - [ ] Generate new Tenant Keys (TK).
    - [ ] Encrypt/Decrypt TK using SMK.
- [ ] **EncryptionService**:
    - [ ] Implement AES-GCM encryption/decryption logic.
    - [ ] Methods: `encrypt(data, key)`, `decrypt(data, key)`.

## Phase 4: Authentication & Tenant Context
- [ ] **Token Service**: Implement JWT generation (signing) and validation.
- [ ] **Security Filter Chain**: Configure Spring Security Resource Server.
- [ ] **Custom Authentication Converter**: Extract `tenant_id`, `role`, and `agent_id` from JWT claims into a custom `Authentication` principal.
- [ ] **Tenant Context**: Implement a mechanism (e.g., `ThreadLocal` or scoped bean) to pass the authenticated `tenant_id` to services/repositories safely.

## Phase 5: Core Services & API Implementation

### 5.1 User & Auth Management
- [ ] **AuthService**: Login logic for Admins (Username/Password) and Agents (App Token).
- [ ] **AuthController**: `POST /api/v1/auth/login`.

### 5.2 Secret Management
- [ ] **SecretService**:
    - [ ] `createSecret`: Encrypt value with TK, save to DB.
    - [ ] `getSecret`: Retrieve, decrypt with TK.
    - [ ] `searchSecrets`: Query by metadata.
- [ ] **SecretController**:
    - [ ] `POST /api/v1/secrets`
    - [ ] `GET /api/v1/secrets/:id`
    - [ ] `POST /api/v1/secrets/search`

### 5.3 Request Management (The "Ask" Pattern)
- [ ] **RequestService**:
    - [ ] Create new requests.
    - [ ] Fulfill request (encrypt new secret, link, update status).
    - [ ] Reject request.
- [ ] **RequestController**:
    - [ ] `POST /api/v1/requests`
    - [ ] `GET /api/v1/requests/:id`
    - [ ] `POST /api/v1/requests/:id/fulfill`
    - [ ] `POST /api/v1/requests/:id/reject`

### 5.4 Agent Management
- [ ] **AgentService**: Create agents, generate/rotate tokens.
- [ ] **AgentController**: `/api/v1/agents` endpoints.

## Phase 6: Testing & Validation
- [ ] **Unit Tests**: Test crypto logic and services extensively.
- [ ] **Integration Tests**: `MockMvc` tests for controllers, validating security restrictions (e.g., ensuring Tenant A cannot access Tenant B's secrets).
- [ ] **End-to-End**: Verify the "Missing Secret Flow" manually.

## Phase 7: Polish
- [ ] API Documentation (Swagger/OpenAPI if needed).
- [ ] Finalize `README.md`.
