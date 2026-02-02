# AgentVault Design Document

## 1. Overview
AgentVault is a lightweight, standalone password and secret manager designed for automated agents (e.g., OpenClaw). It bridges the gap between autonomous agents and secure credential management by allowing agents to retrieve secrets and, crucially, request new ones from human admins asynchronously without exposing sensitive data in chat logs.

## 2. Core Philosophy
*   **Agent-Centric:** APIs are designed for machine consumption.
*   **Secure Interaction:** Secrets are never passed through chat/LLM context; only links to the secure Vault UI are shared.
*   **Request-Response:** Agents create requests for credentials and notify the user. The user fulfills them out-of-band.

## 3. Architecture

### 3.1 Components
*   **Vault Server:** A lightweight HTTP server hosting the REST API and a minimal Web UI for admins.
*   **Database:** **MySQL** (replacing SQLite for concurrency and multi-tenancy).
*   **Web UI:** A simple interface for "Secret Owners".

### 3.2 Roles
1.  **System Operator:** Manages the deployment and the **System Master Key**.
2.  **Tenant Admin (Secret Owner):**
    *   Managed within a specific "Tenant".
    *   Full CRUD access to their tenant's secrets.
    *   **Auth:** `tenant_id` + Username/Password.
3.  **Tenant Agent (Secret User):**
    *   **Auth:** `tenant_id` + `app_token`.

## 4. Workflows

### 4.1 Secret Retrieval (Standard)
1.  Agent authenticates with `tenant_id` and `app_token`.
2.  System validates credentials for that Tenant.
3.  System decrypts the **Tenant Key** using the **System Master Key**.
4.  Agent queries API.
5.  System uses **Tenant Key** to decrypt secrets.

### 4.2 Missing Secret Flow (The "Ask" Pattern)
1.  **Search Fail:** Agent cannot find a credential for a specific service.
2.  **Request:** Agent POSTs to `/api/v1/requests` with details:
    *   `context`: "I need to login to AWS to deploy the server."
    *   `service_url`: "https://aws.amazon.com"
    *   `required_fields`: ["access_key", "secret_key"]
3.  **Response:** Server returns a `request_id` and a `fulfillment_url` (e.g., `https://vault.local/fill/123`).
4.  **Notification:** Agent outputs the `fulfillment_url` to the chat: "I need AWS credentials. Please provide them securely here: [LINK]".
5.  **Resolution (Admin Action):**
    *   Admin clicks the link and authenticates.
    *   **Option 1: Fulfill (New Secret):** Admin enters the values. Server creates a new secret and marks request as `fulfilled`.
    *   **Option 2: Map (Existing Secret):** Admin selects an existing secret from the vault to satisfy the request. Request is marked as `fulfilled` and linked to the existing secret.
    *   **Option 3: Reject:** Admin rejects the request (e.g., "Access denied" or "Use your own credentials"). Request is marked as `rejected`.

## 5. API Design (Draft)

### 5.1 Authentication
*   `POST /api/v1/auth/login` - Unified login endpoint.
    *   **Admin Request:** `{ "tenant_id": "uuid...", "username": "admin", "password": "..." }`
    *   **Agent Request:** `{ "tenant_id": "uuid...", "app_token": "..." }`
    *   **Response:** `{ "access_token": "jwt...", "token_type": "bearer", "expires_in": 3600 }`
    *   **JWT Payload:**
        ```json
        {
          "sub": "user-uuid",
          "tenant_id": "tenant-uuid",
          "role": "admin | agent",
          "agent_id": "agent-uuid", // Present ONLY if role is 'agent'
          "iat": 1600000000,
          "exp": 1600003600
        }
        ```
    *   **Note:** All subsequent requests must provide this JWT in the `Authorization: Bearer <token>` header.

### 5.2 Secrets
*   `GET /api/v1/secrets` - List/Search secrets (Scoped to Tenant in JWT).
*   `GET /api/v1/secrets/:id` - Get specific secret (decrypted).
*   `POST /api/v1/secrets` - Create/Update secret (Admin only).

### 5.3 Requests (The Human-in-the-Loop Layer)
*   `POST /api/v1/requests` - Agent creates a request for a missing secret.
*   `GET /api/v1/requests/:id` - Check status of a request (pending/fulfilled/rejected).
*   `POST /api/v1/requests/:id/fulfill` - Admin submits new secret data.
*   `POST /api/v1/requests/:id/map` - Admin maps request to existing `secret_id`.
*   `POST /api/v1/requests/:id/reject` - Admin rejects the request.

### 5.4 Agent & Token Management (Admin Only)
*   `GET /api/v1/agents` - List all agents for the tenant.
*   `POST /api/v1/agents` - Create a new agent.
    *   **Request:** `{ "name": "ci-runner-01" }`
    *   **Response:** `{ "id": "...", "app_token": "at_..." }` (Token shown ONLY once).
*   `POST /api/v1/agents/:id/rotate` - Invalidate old token and issue a new one.
    *   **Response:** `{ "app_token": "at_new..." }`
*   `DELETE /api/v1/agents/:id` - Delete agent and revoke access.

## 6. Data Models

### 6.1 Secret Object
```json
{
  "id": "uuid-v4",
  "name": "AWS Production",
  "url": "https://aws.amazon.com",
  "username": "admin-user",
  "value": "encrypted-string-blob",
  "metadata": {
    "tags": ["cloud", "production"],
    "created_at": "2023-10-27T10:00:00Z",
    "updated_at": "2023-10-27T10:00:00Z"
  }
}
```

### 6.2 Request Object
```json
{
  "request_id": "uuid-v4",
  "status": "pending", // pending, fulfilled, rejected
  "requester_agent_id": "agent-007",
  "context": "Need access to update DNS records",
  "service_url": "https://cloudflare.com",
  "required_fields": ["api_token"],
  "fulfillment_url": "https://vault.local/fill/uuid-v4",
  "mapped_secret_id": "uuid-v4", // Nullable, set if mapped to existing
  "rejection_reason": "Too much power requested", // Nullable
  "created_at": "2023-10-27T12:00:00Z"
}
```

## 7. Technology Stack
*   **Backend:** Python 3.11+ with **FastAPI**.
*   **Database:** **MySQL 8.0+**.
*   **Encryption:** **Cryptography** library (AES-GCM).
*   **ORM:** SQLAlchemy (Async).

## 9. Database Schema (MySQL)

### 9.1 `tenants`
*   `id` (PK, UUID)
*   `name` (Varchar, for internal ref)
*   `encrypted_tenant_key` (Blob) - The random AES-256 key for this tenant, encrypted by the System Master Key.
*   `status` (Enum: active, suspended)
*   `created_at`

### 9.2 `users`
*   `id` (PK, UUID)
*   `tenant_id` (FK -> tenants.id)
*   `username` (Varchar, Unique per Tenant)
*   `password_hash` (Argon2id, Nullable for pure agents)
*   `role` (Enum: 'admin', 'agent')
*   `app_token_hash` (SHA-256, Unique per Tenant, Nullable)
*   `created_at`

### 9.3 `secrets`
*   `id` (PK, UUID)
*   `tenant_id` (FK -> tenants.id)
*   `name` (Index)
*   `url` (Index)
*   `encrypted_data` (Blob) - Encrypted using the **Tenant Key**.
*   `nonce` (Blob)
*   `tag` (Blob)
*   `created_at`
*   `updated_at`

### 9.4 `requests`
*   `id` (PK, UUID)
*   `tenant_id` (FK -> tenants.id)
*   `requester_id` (FK -> users.id)
*   `status` (Enum: 'pending', 'fulfilled', 'rejected')
*   `payload` (JSON)
*   `mapped_secret_id` (FK -> secrets.id, Nullable)
*   `rejection_reason` (String, Nullable)
*   `created_at`
*   `resolved_at`

### 9.5 `audit_logs`
*   `id` (PK, BigInt, AutoInc)
*   `tenant_id` (FK -> tenants.id)
*   `user_id` (FK -> users.id)
*   `action` (String)
*   `resource_id` (String)
*   `ip_address` (String)
*   `timestamp` (DateTime)

## 10. Security Deep Dive (Multi-Tenant)

### 10.1 Key Hierarchy
To ensure tenant isolation and secure automation, we use a 2-tier key architecture:

1.  **System Master Key (SMK):**
    *   **Source:** Provided to the server process via a secure environment variable (`AGENTVAULT_SYSTEM_KEY`) or a secrets manager at startup.
    *   **Usage:** Never stored in the DB. Used *only* to encrypt/decrypt the `encrypted_tenant_key` column in the `tenants` table.

2.  **Tenant Key (TK):**
    *   **Creation:** Generated randomly (AES-256) when a new Tenant is created.
    *   **Storage:** Stored in `tenants.encrypted_tenant_key` (Encrypted by SMK).
    *   **Usage:** Loaded into memory scope during a request to encrypt/decrypt that specific tenant's `secrets`.

### 10.2 Tenant Context
*   **Explicit Identification:** The `tenant_id` must be provided explicitly during the initial login/authentication phase.
    *   Admins provide it alongside credentials.
    *   Agents provide it (likely injected via environment variables) alongside their `app_token`.
*   **Token-Based Enforcement:** Upon successful authentication, the `tenant_id` is baked into the signed JWT.
*   **Request Isolation:** All API endpoints extract the `tenant_id` from the JWT. The application layer enforces strict filtering (e.g., `WHERE tenant_id = ?`) on all database queries to prevent cross-tenant data leakage.
