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
- [x] **KeyManagementService**:
    - [x] Load `AGENTVAULT_SYSTEM_KEY` (SMK) from environment.
    - [x] Generate new Tenant Keys (TK).
    - [x] Encrypt/Decrypt TK using SMK.
- [x] **EncryptionService**:
    - [x] Implement AES-GCM encryption/decryption logic.
    - [x] Methods: `encrypt(data, key)`, `decrypt(data, key)`.

## Phase 4: Authentication & Tenant Context
- [x] **Token Service**: Implement JWT generation (signing) and validation.
- [x] **Security Filter Chain**: Configure Spring Security Resource Server.
- [x] **Custom Authentication Converter**: Extract `tenant_id`, `role`, and `agent_id` from JWT claims into a custom `Authentication` principal.
- [x] **Tenant Context**: Implement a mechanism (e.g., `ThreadLocal` or scoped bean) to pass the authenticated `tenant_id` to services/repositories safely.

## Phase 5: Core Services & API Implementation

### 5.1 User & Auth Management
- [x] **AuthService**: Login logic for Admins (Username/Password) and Agents (App Token).
- [x] **AuthController**: `POST /api/v1/auth/login`.
- [x] **Change Password**:
    - [x] `POST /api/v1/auth/change-password` (Authenticated)
- [x] **Forgot Password Flow** (Email integration deferred):
    - [x] `POST /api/v1/auth/forgot-password` (Generate reset token with expiry)
    - [x] `POST /api/v1/auth/reset-password` (Verify token and update password)

### 5.2 Secret Management
- [x] **SecretService**:
    - [x] `createSecret`: Encrypt value with TK, save to DB.
    - [x] `getSecret`: Retrieve, decrypt with TK.
    - [x] `searchSecrets`: Query by metadata.
    - [x] `deleteSecret`: Soft/Hard delete secret.
- [x] **SecretController**:
    - [x] `POST /api/v1/secrets`
    - [x] `GET /api/v1/secrets/:id`
    - [x] `DELETE /api/v1/secrets/:id`
    - [x] `POST /api/v1/secrets/search`
    - 
### 5.3 Agent Management
- [x] **AgentService**: Create agents, generate/rotate tokens.
- [x] **AgentController**: `/api/v1/agents` endpoints.


### 5.4 Request Management (The "Ask" Pattern)
- [x] **RequestService**:
    - [x] Create new requests.
    - [x] Fulfill request (encrypt new secret, link, update status).
    - [x] Reject request.
- [x] **RequestController**:
    - [x] `POST /api/v1/requests`
    - [x] `GET /api/v1/requests/:id`
    - [x] `POST /api/v1/requests/:id/fulfill`
    - [x] `POST /api/v1/requests/:id/reject`

## Phase 6: Testing & Validation
- [x] **Unit Tests**: Test crypto logic and services extensively.
- [x] **Integration Tests**: `MockMvc` tests for controllers, validating security restrictions (e.g., ensuring Tenant A cannot access Tenant B's secrets).
- [x] **End-to-End**: Verify the "Missing Secret Flow" manually (and via automated test).

## Phase 7: Polish
- [x] API Documentation (Swagger/OpenAPI if needed).
- [x] Finalize `README.md`.
