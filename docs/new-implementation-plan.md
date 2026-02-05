# New Implementation Plan: Client-Side Encryption Architecture

## Overview
This plan outlines the transition of AgentVault from a server-side encryption model to a zero-knowledge architecture where the server only stores pre-encrypted blobs. The server will no longer possess any keys to decrypt user secrets.

## 1. Remove Server-Side Encryption
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/EncryptionService.java` and its tests.
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/KeyManagementService.java` and its tests.
*   **Action:** Delete `src/main/java/com/agentvault/service/crypto/MasterKeyProvider.java` and `EnvVarMasterKeyProvider.java`.
*   **Action:** Remove `encryptedTenantKey` from the `Tenant` model.
*   **Action:** Remove dependencies on these services in `SecretService`, `UserService`, and `DataSeeder`.

## 2. Update Data Models
*   **Secret Model:**
    *   Rename `encryptedValue` to `encryptedData` (or similar) to indicate it's an opaque blob.
    *   Change the type to `String` (Base64 encoded)
*   **Tenant Model:**
    *   Remove `encryptedTenantKey`.
*   **User (Agent) Model:**
    *   Add a string field for the user's **Public Key** (`publicKey`), stored as a PEM string. This is used by others to encrypt secrets for this user (agent).
    *   Add `encryptedMasterKeySalt` (String): Stores the user's master key salt, encrypted using the SYSTEM key.
*   **Lease Model:**
    *   Create a new entity `Lease` to store the secret data encrypted specifically for an agent.
    *   Fields:
        *   `id` (String/ObjectId).
        *   `leaseId` (UUID, public).
        *   `secretId` (UUID, FK to Secret).
        *   `agentId` (UUID, FK to Agent/User).
        *   `encryptedData` (Base64 string): The secret value encrypted with the Agent's Public Key.
        *   `expiry` (LocalDateTime): When the lease expires. Null if no expiry
    *   Relationships: A Secret can have multiple Leases (one per agent). The Secret object itself stores the owner's copy (if any), while Leases store the agent copies.

## 3. Update API DTOs
*   **CreateSecretRequest:**
    *   Remove `value` (plaintext).
    *   Add `encryptedValue` (Base64 string). The client must encrypt this before sending.
*   **SecretResponse:**
    *   Remove `value` (decrypted).
    *   Add `encryptedValue` (Base64 string). The client must decrypt this.
*   **Agent Registration:**
    *   Update `POST /api/v1/agents` or a new endpoint to accept the agent's public key.

## 4. Refactor SecretService
*   **Create Secret:**
    *   Remove logic that generates/retrieves tenant keys.
    *   Simply store the provided `encryptedValue` directly into the database.
*   **Get Secret:**
    *   Return the stored `encryptedValue` without any decryption.
    *   Remove checks that depended on server-side decryption (e.g., verifying visibility might still apply, but access control relies on the client having the private key).

## 5. Refactor Request/Lease Flow (The "Missing Secret" Flow)
*   The server currently facilitates the "handshake".
*   **Request:** Agent requests a secret.
*   **Fulfillment:**
    *   Admin retrieves the agent's public key from the server (via `GET /api/v1/agents/{id}`).
    *   Admin encrypts the secret value with the agent's public key **on their client**.
    *   Admin sends the encrypted blob to the server via `PATCH /api/v1/requests/{id}` (Fulfill).
    *   Server stores this blob (as a new Secret or a Lease entry).
*   **Lease:**
    *   If utilizing the "Lease" concept, the lease object will store the encrypted-for-agent blob.

## 6. Cleanup & Configuration
*   Remove `agentvault.system.key` from `application.properties` and environment variables.
*   Update `DataSeeder` to stop generating tenant keys.

## 7. Verification
*   Update tests to mock client-side encryption (i.e., pass dummy "encrypted" strings).
*   Ensure no `javax.crypto` or `java.security` classes are used for *data* encryption on the server (hashing for passwords/tokens is still allowed).

## 8. Documentation
*   Update `openapi.yaml` to reflect the new API contract (encrypted fields).
