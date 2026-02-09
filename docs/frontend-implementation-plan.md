# Frontend Implementation Plan: AgentPassVault Client ecosystem

## Overview
This plan outlines the development of the client-side components of AgentPassVault, including the core SDK, the Agent CLI, and the Web UI (Admin/Fulfillment). It follows the zero-knowledge architecture and Bitwarden-compatible encryption standards.

## [ ] 1. Core SDK (`packages/sdk`)
The SDK provides the cryptographic primitives and API client logic used by both the CLI and Web UI.

- [x] **1.1 Models & Interfaces:** Define core data entities (`Secret`, `Request`, `Agent`, `Lease`).
- [x] **1.2 Cryptographic Primitives:**
    - [x] PBKDF2 Master Key derivation (`MasterKeyService`).
    - [x] Symmetric encryption/decryption (AES-CBC + HMAC) (`CryptoService`).
    - [x] Asymmetric encryption/decryption (RSA-OAEP) (`CryptoService`).
    - [x] Bitwarden-compatible "Type 2" Cipher String parsing/serialization (`CipherStringParser`).
- [x] **1.3 High-Level Services:**
    - [x] `SecretService`: Logic for encrypting/decrypting secrets with the Master Key.
    - [x] `LeaseService`: Logic for re-encrypting secrets for agents using their public keys.
- [x] **1.4 Verification:**
    - [x] Unit tests for all crypto operations.
    - [x] Head-to-head compatibility tests with Bitwarden test vectors.
- [x] **1.5 API Client:**
    - [x] Implement `VaultClient` using `fetch` (or similar).
    - [x] Handle Authentication (Login for Humans and Agents).
    - [x] Implement Idempotency-Key handling.
    - [x] CRUD operations for Secrets, Agents, and Requests.

## [x] 2. Agent CLI (`apps/cli`)
The CLI tool used by autonomous agents to retrieve and manage secrets.

Store the config and the generated files in the users ~/.config/agentpassvault. When generate the secrets check if the directory `~/.config/agentpassvault/keys` has 600 permission.

- [x] **2.0 Configuration:** Handle `tenant_id`, `app_token`, and API URL via env/config file. We can have a `setup` to generate the config yaml or take the config file a input arg or take the config file from ~/.config/agentpassvault/config.json
- [x] **2.1 Auth**: grab the JWT token and store it
- [x] **2.2 Identity Management:**
    - [x] Generate and store RSA-OAEP 4096-bit key pair locally. command `agentpassvault identity generate-key`
    - [x] Public key registration with the server. command `agentpassvault identity register`. This command also includes key generation
- [x] **2.3 Secret Operations:**
    - [x] `agentpassvault get-secret <id>`: Retrieve and decrypt a leased secret.
    - [x] `agentpassvault search-secrets <metadata>`: Find secrets by metadata.
- [x] **2.4 Request Management:**
    - [x] `agentpassvault request-secret <details>`: Create a new secret request when a credential is missing.
    - [x] Monitor request status. `agentpassvault get-request <id>`

## [ ] 3. Admin CLI (`apps/cli`)
The CLI tool for human administrators to manage the vault, agents, and fulfill requests.

- [ ] **3.1 Authentication & Key Management:**
    - [ ] `admin login`: Login with username/password, derive Master Key, and store session token.
    - [ ] Support for 2FA (TOTP) during login.
    - [ ] Securely handle Master Key in memory (prompt for password when needed for crypto operations).
- [ ] **3.2 Secret Management (Owner CRUD):**
    - [ ] `admin secret create <name> --value <plain>`: Encrypt with Master Key and store.
    - [ ] `admin secret list`: List metadata of all secrets.
    - [ ] `admin secret view <id>`: Fetch and decrypt with Master Key.
    - [ ] `admin secret delete <id>`.
- [ ] **3.3 Agent Management:**
    - [ ] `admin agent list`: View all registered agents.
    - [ ] `admin agent create <name>`: Create a new agent and get its `app_token`.
    - [ ] `admin agent rotate <id>`: Rotate an agent's `app_token`.
    - [ ] `admin agent delete <id>`.
- [ ] **3.4 Request Fulfillment (The "Ask" Pattern):**
    - [ ] `admin request list`: View pending secret requests.
    - [ ] `admin request fulfill <request-id> --secret-id <id>`: fulfill by leasing an existing secret.
    - [ ] `admin request fulfill <request-id> --value <plain>`: fulfill by creating a new secret.
    - [ ] `admin request reject <request-id> --reason <text>`.

## [ ] 4. Web UI (`apps/web`)
The interface for human administrators to manage the vault and fulfill agent requests.

- [ ] **4.1 Authentication & Session:**
    - [ ] Secure login and Master Password handling.
    - [ ] Master Key derivation and persistence (Session memory only, unless WebAuthN implemented).
- [ ] **4.2 Vault Management:**
    - [ ] Secret CRUD with client-side encryption.
    - [ ] Metadata management.
- [ ] **4.3 Agent Management:**
    - [ ] Create agents and view their registration status.
    - [ ] Manage app tokens.
- [ ] **4.4 Request Fulfillment (The "Ask" Pattern):**
    - [ ] Dashboard for pending requests.
    - [ ] Fulfillment flow: Decrypt with Master Key -> Re-encrypt with Agent Public Key -> Post Lease.

## [ ] 5. Configuration & Environment Variables
The applications will be configured via environment variables to ensure flexibility across different environments.

- **Web UI (`apps/web`):**
    - `VITE_API_URL`: The base URL of the AgentPassVault API (e.g., `http://localhost:8080`).
- **Agent CLI (`apps/cli`):**
    - `AGENTPASSVAULT_API_URL`: The base URL of the AgentPassVault API.
    - `AGENTPASSVAULT_TENANT_ID`: The tenant ID for the agent.
    - `AGENTPASSVAULT_APP_TOKEN`: The application token for the agent.

## [ ] 6. Integration & Polishing
- [ ] End-to-end integration tests between CLI, Web UI, and Backend.
- [ ] Error handling and user-friendly error messages.
- [ ] Documentation for installation and usage.
