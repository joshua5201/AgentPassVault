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

## [ ] 2. Agent CLI (`apps/cli`)
The CLI tool used by autonomous agents to retrieve and manage secrets.

- [ ] **2.1 Configuration:** Handle `tenant_id`, `app_token`, and API URL via env/config file.
- [ ] **2.2 Identity Management:**
    - [ ] Generate and store RSA-OAEP 4096-bit key pair locally.
    - [ ] Public key registration with the server.
- [ ] **2.3 Secret Operations:**
    - [ ] `get-secret <id>`: Retrieve and decrypt a leased secret.
    - [ ] `search-secrets <metadata>`: Find secrets by metadata.
- [ ] **2.4 Request Management:**
    - [ ] `request-secret <details>`: Create a new secret request when a credential is missing.
    - [ ] Monitor request status.

## [ ] 3. Web UI (`apps/web`)
The interface for human administrators to manage the vault and fulfill agent requests.

- [ ] **3.1 Authentication & Session:**
    - [ ] Secure login and Master Password handling.
    - [ ] Master Key derivation and persistence (Session memory only, unless WebAuthN implemented).
- [ ] **3.2 Vault Management:**
    - [ ] Secret CRUD with client-side encryption.
    - [ ] Metadata management.
- [ ] **3.3 Agent Management:**
    - [ ] Create agents and view their registration status.
    - [ ] Manage app tokens.
- [ ] **3.4 Request Fulfillment (The "Ask" Pattern):**
    - [ ] Dashboard for pending requests.
    - [ ] Fulfillment flow: Decrypt with Master Key -> Re-encrypt with Agent Public Key -> Post Lease.

## [ ] 4. Configuration & Environment Variables
The applications will be configured via environment variables to ensure flexibility across different environments.

- **Web UI (`apps/web`):**
    - `VITE_API_URL`: The base URL of the AgentPassVault API (e.g., `http://localhost:8080`).
- **Agent CLI (`apps/cli`):**
    - `AGENTPASSVAULT_API_URL`: The base URL of the AgentPassVault API.
    - `AGENTPASSVAULT_TENANT_ID`: The tenant ID for the agent.
    - `AGENTPASSVAULT_APP_TOKEN`: The application token for the agent.

## [ ] 5. Integration & Polishing
- [ ] End-to-end integration tests between CLI, Web UI, and Backend.
- [ ] Error handling and user-friendly error messages.
- [ ] Documentation for installation and usage.
