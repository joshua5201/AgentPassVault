# Agent Secret Listing & Search by Name - Implementation Plan

This document outlines the plan to implement two new features: searching for secrets by name and a unified command to list all secrets for both admins and agents, showing relevant lease information.

---

## 1. Frontend (CLI) Changes

### `search-secrets` Command
- **File**: `frontend/apps/cli/src/index.ts`
- **Change**: Add a new `--name <string>` option to the `search-secrets` command.
- **Example**: `agentpassvault search-secrets --name "database"`

### `list-secrets` Command (New & Unified)
- **File**: `frontend/apps/cli/src/index.ts`
- **Change**: Create a new top-level command `program.command("list-secrets")`.
- **Description**: "Lists all secrets in the tenant. For agents, shows only their active lease. For admins, shows all active leases."
- **Action**: It will call a new function, `listAllSecrets()`.

- **File**: `frontend/apps/cli/src/commands/secrets.ts` (or a shared command file)
- **Change**: Implement `listAllSecrets()`. This function will call a new method on the `VaultClient` (e.g., `client.listSecrets()`) and print the resulting JSON array.

### SDK (`VaultClient`)
- **File**: `frontend/packages/sdk/src/api/VaultClient.ts`
- **Change**:
    - Add a new method `listSecrets()` that makes a `GET` request to `/api/v1/secrets`.

---

## 2. Backend Changes

### `SecretController.java`
- **Endpoint**: `/api/v1/secrets/search` (POST)
  - **Change**: The `SearchSecretRequest` DTO will be updated to include an optional `String name`. The controller method will pass this to the service layer.
- **New Endpoint**: `GET /api/v1/secrets`
  - **Change**: Create a new endpoint that is secured for any authenticated user (`@PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")`).
  - **Logic**: It will take the `AgentPassVaultAuthentication` principal and call a new service method `secretService.listAllSecretsForPrincipal(principal)`.

### `SecretService.java`
- **New Method**: `listAllSecretsForPrincipal(AgentPassVaultAuthentication principal)`
  - **Logic**:
    1.  Get `tenantId` from the principal. Fetch all secrets for the tenant: `secretRepository.findAllByTenantId(tenantId)`.
    2.  Get all secret IDs from the list.
    3.  **Conditional Lease Fetching:**
        -   **If role is ADMIN**: Fetch all leases for all secrets: `leaseRepository.findAllBySecretIdInAndExpiresAtAfter(secretIds, Instant.now())`.
        -   **If role is AGENT**: 
            - Fetch the agent's user record to get its *current* `publicKey`.
            - Fetch leases for this specific agent: `leaseRepository.findAllByAgentIdAndTenantIdAndExpiresAtAfter(principal.getUserId(), tenantId, Instant.now())`.
            - **Filter** the fetched leases to exclude any where `lease.publicKey` does not match the agent's current `publicKey`.
    4.  Create a `Map<Long, List<Lease>>` where the key is the `secretId` for efficient lookups.
    5.  Iterate through the full list of secrets. For each secret, create a new `SecretDetailsResponse` DTO. Look up its leases in the map and populate the `activeLeases` field.
    6.  Return the list of these new, enriched DTOs.

### `AgentService.java`
- **Method**: `registerPublicKey(Long tenantId, Long agentId, String publicKey)`
  - **Change**: When a new public key is registered, "soft delete" (or hard delete if soft delete isn't implemented system-wide) all existing leases for this agent that use the old public key, as the agent can no longer decrypt them. We will implement this as a hard delete (`deleteAllByAgentIdAndPublicKeyNot`) to keep the DB clean, or add a `deleted` flag if auditability is strictly required.

### `SecretRepository.java`
- **New Method**: `findByNameContainingIgnoreCaseAndTenantId(String name, Long tenantId)`
- **New/Existing Method**: `findAllByTenantId(Long tenantId)`.

### `LeaseRepository.java`
- **N+1 Prevention**: All new lease fetching methods will use `@Query` with `JOIN FETCH l.agent` and `JOIN FETCH l.secret` to prevent N+1 queries caused by default `FetchType.EAGER` annotations on those relationships.
- **New Method**: `findAllByAgentIdAndTenantIdAndExpiresAtAfter(Long agentId, Long tenantId, Instant timestamp)`
- **New Method**: `findAllBySecretIdInAndExpiresAtAfter(List<Long> secretIds, Instant timestamp)`
- **New Method**: `deleteAllByAgentIdAndPublicKeyNot(Long agentId, String publicKey)` (for cleaning up old leases)

---

## 3. API/DTO Changes
- `SearchSecretRequest.java` will be updated to include `String name`.
- A new `SecretDetailsResponse.java` DTO will be created. It will contain `Secret` metadata (ID, name) and a list of `LeaseInfo` objects in a field named `activeLeases`.
- A new `LeaseInfo.java` DTO will be created to hold public lease data (e.g., `leaseId`, `agentId`, `expiresAt`, **`publicKey`**).
- A new entry will be added to `openapi.yaml` for the `GET /api/v1/secrets` endpoint.
- After backend changes, run the `./scripts/management/sync-dtos.sh` script to update the frontend SDK.

---

## 4. Testing Strategy

### Backend Tests
- **File**: `src/test/java/com/agentpassvault/controller/SecretControllerTest.java`
- **New Tests**:
    - **Admin Test**: Call `GET /api/v1/secrets` as an Admin. Create 2 agents and 1 secret. Lease the secret to both agents. Verify the response contains 1 secret with 2 leases in its `activeLeases` list.
    - **Agent Test**: Call `GET /api/v1/secrets` as Agent A. Use the same setup as the admin test. Verify the response contains 1 secret, but its `activeLeases` list has only 1 entry (the lease for Agent A).

### Frontend Tests
- **File**: `frontend/apps/cli/test/e2e/cli.test.ts`
- **New Scenarios**:
    - Add a test scenario where a secret is created, and then `agentpassvault search-secrets --name "partial-name"` is run to ensure the correct secret is found.
    - Add a test scenario for `agentpassvault list-secrets` that mimics the backend test logic to ensure the CLI correctly displays the lease status.
