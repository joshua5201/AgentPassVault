# Frontend Design Document

## Overview
The frontend architecture for AgentPassVault is a TypeScript-based monorepo managed by **Turborepo** and **PNPM**. It encompasses the tools for both human operators (Web UI) and autonomous agents (CLI/SDK).

## Project Structure
The repository is organized into three main workspaces:

1.  **`packages/sdk`**: The core logic library. It handles:
    *   **Crypto Primitives:** All encryption/decryption logic using the Web Crypto API.
    *   **API Client:** Typed REST API interactions (using `fetch` or a lightweight wrapper).
    *   **State Management:** Session handling, token storage (memory/secure storage).
    *   *Goal:* This package should be usable in both Browser (Web UI) and Node.js (CLI) environments.

2.  **`apps/cli`**: The Command Line Interface for agents.
    *   **User:** Autonomous agents (and potentially power users).
    *   **Function:** Registration, key generation, secret retrieval, and "Ask" requests.
    *   **Runtime:** Node.js.

3.  **`apps/web`**: The Web User Interface.
    *   **User:** Human administrators ("Secret Owners").
    *   **Function:** Tenant creation, secret management, request fulfillment ("Human-in-the-loop").
    *   **Runtime:** Browser (React).

## Technology Stack

### Core
*   **Language:** TypeScript (Strict Mode).
*   **Package Manager:** PNPM (efficient disk space usage, strict dependency handling).
*   **Build System:** Turborepo (caching, task orchestration).
*   **Linter/Formatter:** Biome (Fast, all-in-one tool) or ESLint + Prettier.

### Libraries
*   **Encryption:** Native `Web Crypto API` (Browser) and `node:crypto` (Node.js).
    *   *Constraint:* Minimize external crypto dependencies to ensure auditability and reduce supply chain risk.
*   **Validation:** `Zod` (Runtime schema validation for API responses and inputs).
*   **State Management:** `Zustand` (Lightweight, for Web UI).
*   **CLI Framework:** `Commander.js` or `Oclif`.
*   **Web Framework:** React + Vite.
*   **UI Components:** Tailwind CSS + Radix UI (or Shadcn/ui) for accessible, lightweight components.

## Encryption Standards (Bitwarden Compatibility)
To ensure robust security and potential future interoperability, we adopt encryption standards aligned with Bitwarden's architecture.

### 1. Master Key Derivation
*   **Algorithm:** PBKDF2-HMAC-SHA256.
*   **Iterations:** 600,000 (Default) - Configurable in future.
*   **Input:** User Password + Email (Salt).
*   **Output:** Master Key (MK) - 256-bit.
*   *Note:* The MK is *never* sent to the server.

### 2. Vault Encryption (Symmetric - Bitwarden Compatible)
*   **Standard:** Bitwarden Protocol (Cipher String Type 2).
*   **Encryption Algorithm:** AES-CBC (256-bit) with PKCS7 padding.
*   **Integrity Algorithm:** HMAC-SHA256 (Encrypt-then-MAC).
*   **Key Derivation:** The 256-bit Master Key is split or stretched (depending on specific Bitwarden version behavior) to generate Encryption and MAC keys. *Investigation needed during implementation to match exact Key expansion logic.*
*   **Storage Format:** `{type}.{iv}|{ciphertext}|{mac}`
    *   `type`: `2` (indicates AES-256-CBC + HMAC-SHA256).
    *   `iv`: Base64 encoded Initialization Vector (16 bytes).
    *   `ciphertext`: Base64 encoded encrypted data.
    *   `mac`: Base64 encoded HMAC signature (32 bytes).

### 3. Agent Key Exchange (Asymmetric)
*   **Algorithm:** RSA-OAEP.
*   **Parameters:**
    *   Modulus Length: 4096 bits.
    *   Hash Function: SHA-256.
*   **Why not Ed25519/X25519?** Ed25519 is for signatures, not encryption. X25519 requires an ECDH handshake (Ephemeral-Static Diffie-Hellman), which adds significant complexity compared to RSA-OAEP's direct encryption capability. For a hobby project, RSA-OAEP is secure and simpler to implement using standard Web Crypto APIs.

## Database Schema (Key Management)

### Agent Table (Public Key Storage)
We must store the algorithm metadata to support future agility (e.g., migrating to Post-Quantum algos or X25519 later).

| Column | Type | Description |
| :--- | :--- | :--- |
| `public_key` | TEXT / BLOB | The raw public key material (likely PEM encoded SPKI or JSON Web Key string). |
| `key_algorithm` | VARCHAR(50) | The specific algorithm used. Value: `RSA-OAEP-4096`. |
| `key_format` | VARCHAR(20) | The format of the stored key. Value: `spki` (SubjectPublicKeyInfo) or `jwk`. |
| `key_version` | INT | Simple versioning to handle rotation events. |

## Data Flow & Security Boundaries

### Secret Creation
1.  **Human** enters secret in **Web UI**.
2.  **SDK** generates a random symmetric key (or uses MK).
3.  **SDK** encrypts secret value locally.
4.  **Web UI** sends *encrypted* blob to API.

### Secret Fulfillment (The "Ask" Pattern)
1.  **Agent** posts a request (unencrypted metadata).
2.  **Human** opens fulfillment URL.
3.  **Web UI** fetches Agent's Public Key.
4.  **Human** enters/selects secret.
5.  **SDK** encrypts the secret value with **Agent's Public Key**.
6.  **Web UI** sends encrypted blob (Lease) to API.
7.  **Agent** fetches Lease.
8.  **CLI** decrypts using stored Private Key.

## Development Plan

### Phase 1: Scaffold
1.  Initialize Turborepo.
2.  Setup `packages/sdk` skeleton.
3.  Setup `apps/cli` skeleton.
4.  Setup `apps/web` skeleton.

### Phase 2: Core SDK & Crypto
1.  **CryptoService:** Implement `AES-CBC` + `HMAC` (Bitwarden compatible) and `RSA-OAEP`.
2.  **MasterKeyService:** Implement PBKDF2 derivation.
3.  **ApiService:** Implement a **stateless** API client.
    *   The SDK does *not* store tokens internally between instantiations.
    *   Callers (CLI/Web) must pass the `token` or `credentials` to the SDK methods.
    *   Implement typed methods for all endpoints (Auth, Secrets, Requests, Leases).
4.  **AuthService:** Implement login flows (User & Agent) that return tokens to the caller.
5.  **Unit Tests:** comprehensive tests for crypto vectors and API mocking.

### Phase 3: CLI Implementation (MVP)
1.  Agent Registration (Key generation).
2.  Login flow.
3.  `request` command.
4.  `get` command (Decrypt lease).

### Phase 4: Web UI (Fulfillment & Admin)
1.  **Login:** Derive MK from password + salt.
2.  **Dashboard:**
    *   List pending "Missing Secret" requests.
    *   List existing Secrets (CRUD: Create, Read, Update, Delete).
    *   List Agents (CRUD: Register, Revoke, Rotate).
3.  **Fulfillment Flow:**
    *   UI to select or create a secret for a specific request.
    *   Encrypt secret with Agent's Public Key (create Lease).
4.  **Audit Log View:** Display history of secret accesses and modifications.

## License
The frontend code (SDK, CLI, and Web UI) is licensed under the **GNU General Public License v3.0**. See the `frontend/LICENSE` file for details.
