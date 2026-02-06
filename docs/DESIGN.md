# AgentVault Design Document

## Overview
AgentVault is a lightweight, standalone password and secret manager designed for automated agents (e.g., OpenClaw). It bridges the gap between autonomous agents and secure credential management by allowing agents to retrieve secrets and, crucially, request new ones from human admins asynchronously without exposing sensitive data in chat logs.

## Core Philosophy
*   **Agent-Centric:** APIs are designed for machine consumption.
*   **Secure Interaction:** Secrets are never passed through chat/LLM context; only links to the secure Vault UI are shared.
*   **Request-Response:** Agents create requests for credentials and notify the user. The user fulfills them out-of-band.
*   **Zero Knowledge:** The server never stores or transits any plaintext secrets via client-side encryption.
*   **Open Source:** Everyone on the Internet can verify the safety of this system.

## Architecture

### Components
*   **Vault Server:** A lightweight HTTP server hosting the REST API.
*   **Database:** **MySQL 8** (Relational database with JSON support for flexible metadata).
*   **Web UI:** A simple interface for "Secret Owners". This UI does all the encryption/decryption.
*   **Admin Panel:** A simple interface to manage the secrets, manage the agents, see the log, change passwords, etc.
*   **Agent CLI tool:** A CLI tool for the agent to decrypt secrets and interact with the server.

### Roles
*   **System Operator:** Manages the deployment and the System Key to encrypt the user master salt.
*   **Tenant Admin (Secret Owner, the Human):**
    *   Managed within a specific "Tenant".
    *   Full CRUD access to their tenant's secrets.
    *   **Auth:** Username/Password.
*   **Tenant Agent (Secret User, the AI Agent such as OpenClaw):**
    *   **Auth:** `tenant_id` + `app_token`.

## System Limits
To prevent the service from being used as a general-purpose storage or for large file hosting (which could lead to denial of service or high storage costs), strict size limits are enforced:
*   **Secret Value Size:** Both the Web UI and Backend enforce a maximum limit of **64 KB** for the encrypted secret value.
*   **Metadata Size:** The combined size of all metadata keys and values for a single secret is limited to **8 KB**.
*   **Request Context:** The context field in secret requests is limited to **2 KB**.

## Idempotency
To prevent duplicate records and ensure reliable operations over unstable networks, AgentVault supports idempotency for all state-changing operations (`POST` and `PATCH`):
*   **Idempotency-Key Header:** Clients should provide a unique UUID in the `Idempotency-Key` HTTP header.
*   **Behavior:** If the server receives a second request with the same `Idempotency-Key` within a 24-hour window, it will return the same response as the first successful request without performing the action again.
*   **Scope:** Idempotency keys are scoped to the `tenant_id`.

## Roadmap
### MVP 0.1
All features except the features listed in other sections.

### Version 1.0 (Free SaaS ready)
*   Registration.
*   Limits on number of Agents in a tenant.
*   Cloud KMS / AWS Secrets Manager to store the system key.
*   Admin panel.
*   Audit log:
    *   Log every secret operation using integrated log tools in the cloud platform such as Cloudwatch.
    *   Log major operations such as agent registration, creation, lease, revoke in to MySQL and expose to the human user.

### Version 1.1
*   OAuth using Google.

### Version 1.2 (Premium features)
*   Customizable lease period.
*   WebAuthN support in the client side.
*   Feature flags to control features and limits on the agent.
*   Additional users to manage the secrets and agents.

## Workflows

### Authentication

#### The Human
*   The admin user uses username (basically email) and password to obtain a JWT bearer token.
*   The admin user uses Google to login or create the user (Version 1.1).

#### The Agent
*   The human creates agent records in the system with an appToken.
*   The agent uses the appToken+tenantId to obtain a JWT bearer token.

### Registration
(version 1.0)
*   A tenant and the user is created during the registration flow.
*   The username is unique across the whole system.
*   A salt for master key generation is encrypted by the system key and saved to the DB.

### Secret Creation and Encryption
*   The Human needs to set up a "Master Password".
*   Use the standard ways (follow BitWarden's approach) to generate a "Master Key (MK)" using the master password and the master salt.
*   The MK is never stored to the DB.
*   In the Web Client, the user can:
    1.  Use the master password every time when accessing the secrets.
    2.  Encrypt the master key using WebAuthN and store the encrypted MK to the IndexedDB (Version 1.2).

### Agent Registration
When the first time (or reset) the Agent want to use the API via the CLI, it has to do the registration.

1.  Create a set of public key and private key. They should be stored in persistent storage (possibly .agentvault/) and set the permission to 600.
2.  Register the public key to the system. The system saves or overwrites the public key to the DB field.

### Secret Retrieval (Standard)
When the agent knows the secretId (via search):

1.  Agent authenticates with `tenant_id` and `app_token` via the CLI tool.
2.  System validates credentials for that Tenant.
3.  The system passes the secrets encrypted with the agent's public key.
4.  The CLI tool decrypts the encrypted secret using the agent's private key.

### Missing Secret Flow (The "Ask" Pattern)
When the secret is missing, that means:
1.  There are no secrets known by the agent to use.
2.  The known secret's access is expired.

#### When there are no suitable secrets (Secret mapping or creation flow)

1.  **Missing Secret:** Agent cannot find a credential for a specific service.
2.  **Request:** Agent POSTs to `/api/v1/requests` with details:
    *   `name`: "AWS Production Credentials" (Suggested Name).
    *   `context`: "I need to login to AWS to deploy the server."
    *   `required_metadata`: {"url": "https://aws.amazon.com", "service": "aws"}.
    *   `required_fields_in_secret_value`: ["access_key", "secret_key"].
3.  **Response:** Server returns a `request_id` and a `fulfillment_url` (e.g., `https://vault.local/fill/123`).
4.  **Notification:** Agent outputs the `fulfillment_url` to the chat: "I need AWS credentials. Please provide them securely here: [LINK]".
5.  **Resolution (Admin Action):**
    *   Admin clicks the link and authenticates.
    *   **Option 1: Fulfill (Create and Lease):**
        *   Admin enters the values and sets the expiry.
        *   Save the secret.
        *   Lease the secret.
        *   Server creates a new secret and marks request as `fulfilled`.
    *   **Option 2: Map (Existing Secret):**
        *   Admin selects an existing secret with an expiry (if needed) from the vault to satisfy the request.
        *   Admin leases the secret if needed.
        *   Request is marked as `fulfilled` and linked to the existing secret.
    *   **Option 3: Reject:** Admin rejects the request (e.g., "Access denied" or "Use your own credentials"). Request is marked as `rejected`.

#### When the secret access is outdated (Lease flow)
1.  **Secret Outdated:** The leasedSecret linked to the public is outdated or missing.
2.  **Request:** Agent POSTs to `/api/v1/requests` with details:
    *   `secretId`
    *   `context`: "I need to login to AWS to deploy the server."
3.  **Response:** Server returns a `request_id` and a `fulfillment_url` (e.g., `https://vault.local/fill/123`).
4.  **Notification:** Agent outputs the `fulfillment_url` to the chat: "I need AWS credentials. Please approve here: [LINK]".
5.  **Resolution (Admin Action):**
    *   Admin clicks the link and authenticates.
    *   **Option 1: Fulfill (Lease):**
        *   Admin leases the secret.
        *   Admin marks the request as fulfilled.
    *   **Option 2: Reject:** Admin rejects the request (e.g., "Access denied" or "Use your own credentials"). Request is marked as `rejected`.

### Lease flow
When the user approves (sometimes upon creation), the system goes through a lease flow:

1.  If not during creation, the Web UI decrypts the secret with MK. We get the plaintext.
2.  The Web UI encrypts the plaintext with the agent's public key and sends back the encrypted value. The user can choose permanent or with expiry.
3.  The server stores the secret encrypted with the agent's public key and stores it to "LeasedSecrets" linked to the Secret with the expiry.

## API Design (Draft)

### Registration (Version 1.0)
`POST /api/v1/register` - Create a new tenant and the admin user.

### Authentication
*   `POST /api/v1/auth/login/user` - User's login endpoint to obtain JWT key.
*   `POST /api/v1/auth/login/agent` - Agent's login endpoint to obtain JWT key.
*   `POST /api/v1/auth/change-password` - Change password.
*   `POST /api/v1/auth/forgot-password` - Initiate password reset flow.
*   `POST /api/v1/auth/reset-password` - Complete password reset.

### Secrets
*   `POST /api/v1/secrets/search` - Search secrets by arbitrary metadata.
*   `GET /api/v1/secrets/:id` - Get the secret encrypted by agent's public key.
*   `POST /api/v1/secrets` - Create secret (Admin only).
*   `DELETE /api/v1/secrets/:id` - Delete a secret (Admin only).
*   `PATCH /api/v1/secrets/:id` - Update secret (update secret value, metadata, etc.). If the secret is updated, the leases are automatically re-encrypted using the public keys.

### Secret leases
*   `GET /api/v1/secrets/:id/leases/?agentId={agentId}` - List the leases of this secret. The agentId filter is optional.
*   `POST /api/v1/secrets/:id/leases/` - Create a new lease, this is also used to update the expiry.
*   `DELETE /api/v1/secrets/:id/leases/:agentId` - Revoke an agent's access to the secret.

### Requests (The Human-in-the-Loop Layer)
*   `POST /api/v1/requests` - Agent creates a request for a missing secret or expired lease.
*   `GET /api/v1/requests/:id` - Check status of a request (pending/fulfilled/rejected).
*   `PATCH /api/v1/requests/:id` - Admin updates the status of the request.
*   `DELETE /api/v1/requests/:id` - Agent cancels the request.

### Agent & Token Management (Admin Only)
*   `GET /api/v1/agents` - List all agents for the tenant.
*   `POST /api/v1/agents` - Create a new agent.
*   `POST /api/v1/agents/:id/register` - The agent registers its public key. If a key is updated it can't access the previous leased secrets.
*   `POST /api/v1/agents/:id/rotate` - Invalidate old appToken and issue a new one.
*   `DELETE /api/v1/agents/:id` - Delete agent and revoke access.

### Audit log
`GET /api/v1/audit-logs/`: Get all audit logs
*   Filters:
    *   simple timestamp filters (loggedBefore, loggedAfter).
    *   agentId, secretId, requestId exact matches.

## Data Models
*   Secret
    *   Lease
*   Request
*   AuditLog

## Technology Stack
*   **Backend:** Java 21 with **Spring Boot 3**.
*   **Security:** **Spring Security** with **Spring Boot Starter OAuth2 Resource Server** for JWT and Bearer token management.
*   **Database:** **MySQL 8.0+**.
*   **Data Access:** **Spring Data JPA** (Repository pattern and object mapping).
*   **CLI:** Python utility for the agent to use.
*   **Web UI:** JS application utilizing Web Crypto API, WebAuthN and Indexed DB.

## Flexible Metadata Implementation
To support agent-provided metadata while maintaining performance and control, the system uses:
*   **Mapping:** The `metadata` field in `Secret` and `Request` objects is mapped as a `Map<String, String>` and stored in a MySQL `JSON` column.
*   **Indexing:** **JSON Extracts.** We utilize MySQL's functional indexes on specific JSON paths (e.g., `(CAST(metadata->>'$.service' AS CHAR(255)))`) to ensure fast searches for high-value keys.
*   **Search:** Queries leverage JPA specifications or JPQL with native JSON functions to match against metadata keys.

## Tenant Context
*   **Explicit Identification:** The `tenant_id` must be provided explicitly during the initial login/authentication phase.
    *   Admins provide it alongside credentials.
    *   Agents provide it (likely injected via environment variables) alongside their `app_token`.
*   **Token-Based Enforcement:** Upon successful authentication, the `tenant_id` is baked into the signed JWT.
*   **Request Isolation:** All API endpoints extract the `tenant_id` from the JWT. The application layer enforces strict filtering (e.g., `WHERE tenant_id = ?`) on all database queries to prevent cross-tenant data leakage.

## Agent Integration Strategy
*   Provide a CLI tool, which can be installed via a curl command.
*   A system prompt (aka SKILL) MD file to tell the agent not to store the secrets locally, always use CLI to obtain the secrets.

## Deployment
### Optimize local deployment
Scripts to:
*   Setup default tenant and username/password for PROD profile.
*   Setup self-signed SSL cert.

### Cloud deployment
Cloud Run + Cloud SQL + Cloudflare
