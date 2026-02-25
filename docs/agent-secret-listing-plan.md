# Agent Secret Listing & Search by Name - Implementation Plan

This document outlines the plan to implement two new features for the Agent CLI: searching for secrets by name and listing all secrets available to an agent within its tenant.

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
- **Description**: "List all secrets in the tenant, showing lease status for the current agent."
- **Action**: It will call a new function, `listAllSecretsForAgent()`.

- **File**: `frontend/apps/cli/src/commands/secrets.ts`
- **Change**: Implement `listAllSecretsForAgent()`. This function will call a new method on the `VaultClient` (e.g., `client.listAllSecrets()`) and print the resulting JSON array.

### SDK (`VaultClient`)
- **File**: `frontend/packages/sdk/src/api/VaultClient.ts`
- **Change**:
    - Update the `searchSecrets` method to accept an optional `name` in its request body.
    - Add a new method `listAllSecrets()` that makes a `GET` request to `/api/v1/agent/secrets`.

---

## 2. Backend Changes

### `SecretController.java`
- **Endpoint**: `/api/v1/secrets/search` (POST)
  - **Change**: The `SearchSecretRequest` DTO will be updated to include an optional `String name`. The controller method will pass this to the service layer.
- **New Endpoint**: `/api/v1/agent/secrets` (GET)
  - **Change**: Create a new endpoint that is secured for agent access only (`@PreAuthorize("hasRole('AGENT')")`).
  - **Logic**: It will take the `AgentPassVaultAuthentication` principal, extract the `agentId` and `tenantId`, and call a new service method `secretService.listAllSecretsForAgent(agentId, tenantId)`.

### `SecretService.java`
- **Method**: `searchSecrets`
  - **Change**: Update the logic to check if a `name` is provided in the `SearchSecretRequest`. If so, it will call a new repository method, always passing the `tenantId` from the authentication principal.
- **New Method**: `listAllSecretsForAgent(Long agentId, Long tenantId)`
  - **Logic**:
    1. Fetch all secrets for the tenant: `secretRepository.findAllByTenantId(tenantId)`.
    2. Fetch all of this agent's valid leases for the tenant: `leaseRepository.findAllByAgentIdAndTenantId(agentId, tenantId)`.
    3. Create a `Map<Long, Lease>` where the key is the `secretId` for quick lookups.
    4. Iterate through the full list of secrets. For each secret, create a new `AgentSecretListItemResponse` DTO. Check the map to see if a lease exists for that secret's ID. If it does, populate the `lease` field in the DTO.
    5. Return the list of new DTOs.

### `SecretRepository.java`
- **New Method**: `findByNameContainingIgnoreCaseAndTenantId(String name, Long tenantId)`
  - **Query**: A straightforward JPA query to find secrets by name within a specific tenant.
- **New/Existing Method**: `findAllByTenantId(Long tenantId)`.

### `LeaseRepository.java`
- **New Method**: `findAllByAgentIdAndTenantId(Long agentId, Long tenantId)`
  - **Query**: The `Lease` entity is joined with the `Secret` entity to filter by `tenantId`. This ensures an agent from one tenant cannot list leases belonging to a secret in another tenant, even if the agent ID was somehow reused.

---

## 3. API/DTO Changes
- `SearchSecretRequest.java` will be updated to include `String name`.
- A new `AgentSecretListItemResponse.java` DTO will be created. It will contain `Secret` metadata (ID, name) and a nullable `LeaseInfo` field.
- A new `LeaseInfo.java` DTO will be created to hold basic lease data (e.g., `leaseId`, `expiresAt`).
- A new entry will be added to `openapi.yaml` for the `GET /api/v1/agent/secrets` endpoint.
- After backend changes, run the `./scripts/management/sync-dtos.sh` script to update the frontend SDK.

---

## 4. Testing Strategy

### Backend Tests
- **File**: `src/test/java/com/agentpassvault/controller/SecretControllerTest.java`
- **New Tests**:
    - Add a test for `searchSecrets` that uses the new `name` parameter and verifies that only matching secrets are returned.
    - Add a new test for the `GET /api/v1/agent/secrets` endpoint. This will involve:
        1. Creating an agent and two secrets (A and B).
        2. Leasing only secret A to the agent.
        3. Calling the endpoint and verifying that both secrets are returned.
        4. Asserting that secret A's response has a non-null `lease` field and secret B's has a null `lease` field.

### Frontend Tests
- **File**: `frontend/apps/cli/test/e2e/cli.test.ts`
- **New Scenarios**:
    - Add a test scenario where a secret is created, and then `agentpassvault search-secrets --name "partial-name"` is run to ensure the correct secret is found.
    - Add a test scenario for `agentpassvault list-secrets` that mimics the backend test logic to ensure the CLI correctly displays the lease status.
