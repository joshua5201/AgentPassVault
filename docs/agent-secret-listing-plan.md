# Agent Secret Listing & Search by Name - Implementation Plan

This document outlines the plan to implement two new features for the Agent CLI: searching for secrets by name and listing all secrets an agent has access to.

---

## 1. Frontend (CLI) Changes

### `search-secrets` Command
- **File**: `frontend/apps/cli/src/index.ts`
- **Change**: Add a new `--name <string>` option to the `search-secrets` command.
- **Example**: `agentpassvault search-secrets --name "database"`

- **File**: `frontend/apps/cli/src/commands/secrets.ts`
- **Change**: Update the `searchSecrets` function to handle the new `name` option. It will need to pass this new parameter to the `VaultClient`.

### `list-secrets` Command (New)
- **File**: `frontend/apps/cli/src/index.ts`
- **Change**: Create a new command `program.command("list-secrets")`.
- **Description**: "List all secrets this agent has an active lease for."
- **Action**: It will call a new function, `listLeasedSecrets()`.

- **File**: `frontend/apps/cli/src/commands/secrets.ts`
- **Change**: Implement `listLeasedSecrets()`. This function will call a new method on the `VaultClient` (e.g., `client.listLeasedSecrets()`) and print the resulting JSON array.

### SDK (`VaultClient`)
- **File**: `frontend/packages/sdk/src/api/VaultClient.ts`
- **Change**:
    - Update the `searchSecrets` method to accept an optional `name` in its request body.
    - Add a new method `listLeasedSecrets()` that makes a `GET` request to `/api/v1/secrets/leased`.

---

## 2. Backend Changes

### `SecretController.java`
- **Endpoint**: `/api/v1/secrets/search` (POST)
  - **Change**: The `SearchSecretRequest` DTO will be updated to include an optional `String name`. The controller method will pass this to the service layer.
- **New Endpoint**: `/api/v1/secrets/leased` (GET)
  - **Change**: Create a new endpoint that is secured for agent access only (`@PreAuthorize("hasRole('AGENT')")`).
  - **Logic**: It will take the `AgentPassVaultAuthentication` principal, extract the agent's user ID, and call a new service method `secretService.getLeasedSecretsForAgent(agentId)`.

### `SecretService.java`
- **Method**: `searchSecrets`
  - **Change**: Update the logic to check if a `name` is provided in the `SearchSecretRequest`. If so, it will call a new repository method, always passing the `tenantId` from the authentication principal.
- **New Method**: `getLeasedSecretsForAgent(Long agentId, Long tenantId)`
  - **Logic**:
    1. Call a new `leaseRepository` method to find all valid leases for the given `agentId` and `tenantId`.
    2. Extract the `secretId` from each lease.
    3. Use the list of `secretId`s to fetch the corresponding secrets from the `SecretRepository`, again ensuring the query is filtered by `tenantId`.
    4. Map the `Secret` entities to `SecretResponse` DTOs (ensuring the `encryptedValue` is not included) and return the list.

### `SecretRepository.java`
- **New Method**: `findByNameContainingIgnoreCaseAndTenantId(String name, Long tenantId)`
  - **Query**: A straightforward JPA query to find secrets by name within a specific tenant.

### `LeaseRepository.java`
- **New Method**: `findAllByAgentIdAndTenantId(Long agentId, Long tenantId)`
  - **Query**: The `Lease` entity is joined with the `Secret` entity to filter by `tenantId`. This ensures an agent from one tenant cannot list leases belonging to a secret in another tenant, even if the agent ID was somehow reused.


---

## 3. API/DTO Changes
- `SearchSecretRequest.java` will be updated to include `String name`.
- A new entry will be added to `openapi.yaml` for the `GET /api/v1/secrets/leased` endpoint.
- After backend changes, run the `./scripts/management/sync-dtos.sh` script to update the frontend SDK.

---

## 4. Testing Strategy

### Backend Tests
- **File**: `src/test/java/com/agentpassvault/controller/SecretControllerTest.java`
- **New Tests**:
    - Add a test for `searchSecrets` that uses the new `name` parameter and verifies that only matching secrets are returned.
    - Add a new test for the `GET /api/v1/secrets/leased` endpoint. This will involve creating an agent, creating a secret, creating a lease, and then calling the endpoint as the agent to verify the correct secret metadata is returned.

### Frontend Tests
- **File**: `frontend/apps/cli/test/e2e/cli.test.ts`
- **New Scenarios**:
    - Add a test scenario where a secret is created, and then `agentpassvault search-secrets --name "partial-name"` is run to ensure the correct secret is found.
    - Add a test scenario where an agent is leased a secret, and then `agentpassvault list-secrets` is run to verify the secret appears in the output.
