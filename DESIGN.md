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
(Same as before)

## 4. Workflows

### 4.1 Secret Retrieval (Standard)
1.  Agent authenticates with `tenant_id` and `app_token`.
2.  System validates credentials for that Tenant.
3.  System decrypts the **Tenant Key** using the **System Master Key**.
4.  Agent queries API with flexible metadata filters (e.g., `{"metadata.url": "github.com"}`).
5.  System uses **Tenant Key** to decrypt the `value` field.

## 5. API Design (Draft)

### 5.2 Secrets
*   `POST /api/v1/secrets/search` - Search secrets by arbitrary metadata.
    *   **Request:** `{ "query": { "metadata.env": "prod", "metadata.service": "aws" } }`
*   `GET /api/v1/secrets/:id` - Get specific secret (decrypted).
*   `POST /api/v1/secrets` - Create/Update secret (Admin only).
    *   **Body:** `{ "name": "...", "value": "...", "metadata": { ... } }`

(Rest of APIs remain similar)

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
  "context": "Need access to update DNS",
  "required_metadata": { // Agent asks for these fields to be set
    "url": "https://cloudflare.com",
    "api_token": "???"
  },
  "mapped_secret_id": "ObjectId",
  "rejection_reason": "string",
  "created_at": "ISODate"
}
```

## 7. Technology Stack
*   **Backend:** Python 3.11+ with **FastAPI**.
*   **Database:** **MongoDB 6.0+**.
*   **Driver:** **Motor** (Async Python driver for MongoDB).
*   **Encryption:** **Cryptography** library (AES-GCM).

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
