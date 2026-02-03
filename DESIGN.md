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
*   `metadata`: Object (Wildcard Index for efficient search)
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
