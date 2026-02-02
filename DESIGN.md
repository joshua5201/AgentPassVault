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
*   **Storage:** Encrypted local storage (e.g., SQLite + AES-GCM or BoltDB).
*   **Web UI:** A simple interface for "Secret Owners" to approve requests and enter secrets.

### 3.2 Roles
1.  **Secret User (Agent):**
    *   Can list and search secrets (by name, URL, etc.).
    *   Can retrieve secret values.
    *   Can create "Secret Requests" (ask the admin to fill a missing credential).
    *   **Auth:** `app_token` exchanged for JWT (Bearer Token).
2.  **Secret Owner (Admin):**
    *   Full CRUD access to secrets.
    *   Can view and fulfill pending "Secret Requests".
    *   **Auth:** Username/Password exchanged for JWT + Master Password (for unlocking the vault).

## 4. Workflows

### 4.1 Secret Retrieval (Standard)
1.  Agent authenticates to get a JWT.
2.  Agent queries the API (e.g., `GET /api/v1/secrets?domain=github.com`).
3.  If found, the agent retrieves the ID and fetches the decrypted value.

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
    *   **Admin Request:** `{ "username": "admin", "password": "..." }`
    *   **Agent Request:** `{ "app_token": "..." }`
    *   **Response:** `{ "access_token": "jwt...", "token_type": "bearer", "expires_in": 3600 }`

### 5.2 Secrets
*   `GET /api/v1/secrets` - List/Search secrets.
*   `GET /api/v1/secrets/:id` - Get specific secret (decrypted).
*   `POST /api/v1/secrets` - Create/Update secret (Admin only).

### 5.3 Requests (The Human-in-the-Loop Layer)
*   `POST /api/v1/requests` - Agent creates a request for a missing secret.
*   `GET /api/v1/requests/:id` - Check status of a request (pending/fulfilled/rejected).
*   `POST /api/v1/requests/:id/fulfill` - Admin submits new secret data.
*   `POST /api/v1/requests/:id/map` - Admin maps request to existing `secret_id`.
*   `POST /api/v1/requests/:id/reject` - Admin rejects the request.

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

## 7. Technology Stack (Proposed)
*   **Backend:** Python 3.11+ with **FastAPI**.
*   **Database:** **SQLite**.
*   **Encryption:** **Cryptography** library (Fernet/AES-CBC or AES-GCM).
*   **Frontend (Admin UI):** **Vue.js** or **React** (Single Page App).

## 8. Configuration
The application will be configured via a `.env` file or environment variables:
*   `VAULT_PORT`: Port to listen on (default: 8000).
*   `VAULT_SECRET_KEY`: Used for session signing.
*   `VAULT_DB_PATH`: Path to the SQLite DB file.
*   `ALLOW_REGISTRATION`: Boolean (default: false) - If true, allows the first user to set up the Master Password.

## 9. Database Schema (SQLite)

### 9.1 `users`
*   `id` (PK)
*   `username` (Unique, Nullable for pure agents)
*   `password_hash` (Argon2id, Nullable for pure agents)
*   `role` (Enum: 'admin', 'agent')
*   `app_token_hash` (SHA-256, Nullable for admins)
*   `created_at`

### 9.2 `secrets`
*   `id` (PK, UUID)
*   `name` (Index)
*   `url` (Index)
*   `encrypted_data` (The full secret object blob, encrypted)
*   `nonce` (AES-GCM Nonce)
*   `tag` (AES-GCM Auth Tag)
*   `created_at`
*   `updated_at`

### 9.3 `requests`
*   `id` (PK, UUID)
*   `requester_id` (FK -> users.id)
*   `status` (Enum: 'pending', 'fulfilled', 'rejected')
*   `payload` (JSON: context, service_url, required_fields)
*   `mapped_secret_id` (FK -> secrets.id, Nullable)
*   `rejection_reason` (String, Nullable)
*   `created_at`
*   `resolved_at`

### 9.4 `audit_logs`
*   `id` (PK)
*   `user_id` (FK -> users.id, nullable for system events)
*   `action` (e.g., LOGIN_SUCCESS, READ_SECRET, CREATE_REQUEST, FULFILL_REQUEST)
*   `resource_id` (Target secret or request ID)
*   `ip_address`
*   `timestamp`

## 10. Security Deep Dive

### 10.1 Master Key Management
*   **Master Password:** The Admin must provide a master password to "unlock" the vault upon server start.
*   **KDF:** **Argon2id** is used to derive the 256-bit `Encryption Key` from the Master Password + a global Salt.
*   **Volatile Storage:** The `Encryption Key` is held in memory **only** while the process is running. It is never written to disk.
*   **Locking:** If the server process restarts, the vault is effectively "locked" until the API receives the Master Password again via a specific unlock endpoint (or CLI arg, though env var/API is safer).

### 10.2 Audit & Compliance
*   All access to secrets (decryption events) is logged to `audit_logs`.
*   The `encrypted_data` in the `secrets` table includes the secret's value *and* its metadata to prevent metadata leakage, though `name` and `url` are kept as plaintext columns for efficient searching.
