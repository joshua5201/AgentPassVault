# AgentVault Design Document

## 1. Overview
AgentVault is a lightweight, standalone password and secret manager designed for automated agents (e.g., OpenClaw). It bridges the gap between autonomous agents and secure credential management by allowing agents to retrieve secrets and, crucially, request new ones from human admins asynchronously without exposing sensitive data in chat logs.

## 2. Core Philosophy
*   **Agent-Centric:** APIs are designed for machine consumption.
*   **Secure Interaction:** Secrets are never passed through chat/LLM context; only links to the secure Vault UI are shared.
*   **Request-Response:** Agents create requests for credentials and notify the user. The user fulfills them out-of-band.

## 3. Architecture

### 3.1 Components
*   **Vault Server:** A lightweight HTTP server hosting the REST API.
*   **Database:** **MongoDB** (NoSQL for flexible metadata and schema-less secrets).
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
4.  Agent queries API with flexible metadata filters (e.g., `{"metadata.url": "github.com"}`).
5.  System uses **Tenant Key** to decrypt the `value` field.

### 4.2 Missing Secret Flow (The "Ask" Pattern)
1.  **Search Fail:** Agent cannot find a credential for a specific service.
2.  **Request:** Agent POSTs to `/api/v1/requests` with details:
    *   `name`: "AWS Production Credentials" (Suggested Name)
    *   `context`: "I need to login to AWS to deploy the server."
    *   `required_metadata`: {"url": "https://aws.amazon.com", "service": "aws"}
    *   `required_fields_in_secret_value`: ["access_key", "secret_key"]
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
*   `POST /api/v1/secrets/search` - Search secrets by arbitrary metadata.
    *   **Request:** `{ "query": { "metadata.env": "prod", "metadata.service": "aws" } }`
*   `GET /api/v1/secrets/:id` - Get specific secret (decrypted).
*   `POST /api/v1/secrets` - Create/Update secret (Admin only).
    *   **Body:** `{ "name": "...", "value": "...", "metadata": { ... } }`

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

### 6.1 Secret Object (MongoDB Document)
```json
{
  "_id": "ObjectId",
  "tenant_id": "uuid",
  "name": "AWS Production", // Human-readable label
  "encrypted_value": "blob", // The actual secret, encrypted
  "nonce": "blob",
  "tag": "blob",
  "metadata": { // Flexible, unencrypted for search
    "url": "https://aws.amazon.com",
    "username": "admin-user",
    "env": "production",
    "region": "us-east-1",
    "custom_tag": "value"
  },
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 6.2 Request Object (MongoDB Document)
```json
{
  "_id": "ObjectId",
  "request_id": "uuid-v4", // Public ID
  "tenant_id": "uuid",
  "requester_id": "uuid",
  "status": "pending",
  "name": "AWS Production Credentials", // Suggested name from agent
  "context": "Need access to update DNS",
  "required_metadata": { // Agent asks for these fields to be set in secret's metadata
    "url": "https://cloudflare.com"
  },
  "required_fields_in_secret_value": ["api_token"], // Agent asks for these keys to be in the encrypted secret value
  "mapped_secret_id": "ObjectId",
  "rejection_reason": "string",
  "created_at": "ISODate"
}
```

## 7. Technology Stack
*   **Backend:** Java 21 with **Spring Boot 3**.
*   **Security:** **Spring Security** with **Spring Boot Starter OAuth2 Resource Server** for JWT and Bearer token management.
*   **Database:** **MongoDB 6.0+**.
*   **Data Access:** **Spring Data MongoDB** (Repository pattern and object mapping).
*   **Encryption:** **Java Cryptography Architecture (JCA)** (AES-GCM).

## 8. Flexible Metadata Implementation
To support agent-provided metadata while maintaining performance and control, the system uses:
*   **Mapping:** The `metadata` field in `Secret` and `Request` objects is mapped as `Map<String, Object>` or `org.bson.Document`.
*   **Indexing:** **Predefined Keys Only.** We will strictly index specific, high-value keys (e.g., `metadata.service`, `metadata.env`, `metadata.url`) rather than using a wildcard index.
*   **Deferral:** Full `@WildcardIndexed` support is deferred until advanced, arbitrary search capabilities are explicitly required.
*   **Search:** Queries use Spring Data MongoDB's `Criteria` to match against these known keys (e.g., `where("metadata.service").is("aws")`).

## 9. Database Collections (MongoDB)

### 9.1 `tenants`
*   `_id`: UUID
*   `name`: String
*   `encrypted_tenant_key`: Binary
*   `status`: String

### 9.2 `users`
*   `_id`: UUID
*   `tenant_id`: UUID (Indexed)
*   `username`: String (Unique per Tenant)
*   `password_hash`: String
*   `role`: String
*   `app_token_hash`: String (Unique per Tenant)

### 9.3 `secrets`
*   `_id`: ObjectId
*   `tenant_id`: UUID (Indexed)
*   `name`: String (Text Index)
*   `metadata`: Object (Specific named keys indexed; Wildcard index deferred)
*   `encrypted_value`: Binary

### 9.4 `requests`
*   `_id`: ObjectId
*   `tenant_id`: UUID (Indexed)
*   `status`: String (Indexed)
*   ... (other fields)

### 9.5 `audit_logs`
*   `_id`: ObjectId
*   `tenant_id`: UUID (Indexed)
*   ... (other fields)

## 10. Security Deep Dive (Multi-Tenant)

### 10.1 Key Hierarchy
To ensure tenant isolation and secure automation, we use a 2-tier key architecture:

1.  **System Master Key (SMK):**
    *   **Provider Pattern:** To support future integrations with external key management systems (e.g., AWS KMS, Google Cloud KMS, HashiCorp Vault), access to the SMK is abstracted behind a `MasterKeyProvider` interface.
    *   **Default Implementation:** The initial implementation (`EnvVarMasterKeyProvider`) loads the key from a secure environment variable (`AGENTVAULT_SYSTEM_KEY`) at startup.
    *   **Usage:** Never stored in the DB. Used *only* to encrypt/decrypt the `encrypted_tenant_key` column in the `tenants` table.
    *   **Memory Safety:** The SMK must be kept in memory only for the duration of the cryptographic operation and should be cleared (zeroed out) if possible, though Java's immutable Strings/Byte arrays make this challenging. At minimum, it must **never** be logged or serialized.

2.  **Tenant Key (TK):**
    *   **Creation:** Generated randomly (AES-256) when a new Tenant is created.
    *   **Storage:** Stored in `tenants.encrypted_tenant_key` (Encrypted by SMK).
    *   **Usage:** Loaded into memory scope during a request to encrypt/decrypt that specific tenant's `secrets`.
    *   **Memory Safety:** Similar to the SMK, the cleartext TK exists only in memory during the request lifecycle and is never persisted to disk or logs.

### 10.2 Tenant Context
*   **Explicit Identification:** The `tenant_id` must be provided explicitly during the initial login/authentication phase.
    *   Admins provide it alongside credentials.
    *   Agents provide it (likely injected via environment variables) alongside their `app_token`.
*   **Token-Based Enforcement:** Upon successful authentication, the `tenant_id` is baked into the signed JWT.
*   **Request Isolation:** All API endpoints extract the `tenant_id` from the JWT. The application layer enforces strict filtering (e.g., `WHERE tenant_id = ?`) on all database queries to prevent cross-tenant data leakage.

## 11. Agent Integration Strategy

To ensure agents utilize the "Missing Secret Flow" correctly, developers must include the following instructions in the agent's System Prompt:

### 11.1 Standard System Prompt
```text
# Secure Credential Management
You have access to a secure credential vault (AgentVault).
1. **NEVER** ask the user for secrets (API keys, passwords) directly in the chat.
2. **ALWAYS** search the vault first using the `search_secrets` tool with flexible metadata (e.g., domain, service name).
3. **IF MISSING:** Do not fail. Instead, create a "Secret Request" using the `create_secret_request` tool.
   - Suggest a clear, human-readable `name` for the secret.
   - Define the `required_metadata` (e.g., target URL).
   - Define the `required_fields_in_secret_value` (e.g., ["api_key"]).
4. **NOTIFY:** The tool will return a `fulfillment_url`. Display this URL to the user:
   "I need credentials for [Service]. Please provide them securely here: [URL]"
5. **WAIT:** Pause execution or retry periodically until the request is fulfilled.
```

## 12. Future Scaling & Sharding Strategy

As the system grows, we anticipate the need to scale beyond a single replica set. The data model is designed to support **MongoDB Sharding** with minimal refactoring.

### 12.1 Shard Key Strategy
*   **Recommendation:** Use `tenant_id` as the primary component of the shard key (e.g., `{ "tenant_id": 1, "_id": 1 }` or hashed `{ "tenant_id": "hashed" }`).
*   **Why `tenant_id`?**
    *   **Data Locality:** Keeps all data for a single tenant on the same shard, facilitating "Zone Sharding".
    *   **Query Efficiency:** Since almost all application queries are scoped by `tenant_id`, the `mongos` router can target a single shard instead of broadcasting to all shards.
    *   **Isolation:** Allows physically isolating high-value or high-volume tenants onto dedicated hardware shards using MongoDB Zones.

### 12.2 Versus "ID Prefix"
*   While strictly prefixing the `_id` with a tenant identifier (e.g., `tenantA_doc123`) is a valid strategy, we prefer an explicit `tenant_id` field because:
    *   **Flexibility:** It allows changing the shard key definition without migrating data (which requires re-inserting documents).
    *   **Immutability:** MongoDB `_id` fields are immutable. If we needed to move a document or change a tenant association, an ID prefix would make this difficult.
    *   **Standardization:** The separate `tenant_id` field is a standard pattern supported by Spring Data MongoDB and simplifies object mapping.

