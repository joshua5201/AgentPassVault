# Agent CLI Improvement Plan

## Objective
This plan outlines the implementation of three new features for the Agent CLI in the `feat/frontend-improvement` branch:
1.  **`init` Command**: A single-shot initialization command for agents.
2.  **JSON Output**: Make JSON the default output format for the CLI to be more machine-friendly.
3.  **Testing**: Add automated tests to verify these new capabilities.

---

## 1. Implement `init` Command

**Goal**: Combine the existing `setup`, `generate-key`, and `register` steps into a single, cohesive command for easier agent bootstrapping.

**Changes**:
- **`frontend/apps/cli/src/commands/identity.ts`**:
  - Add a new `init` function.
  - This function will accept the same parameters as `setup` (`apiUrl`, `tenantId`, `agentId`, `appToken`).
  - It will sequentially execute the logic of `setup()`, `generateKey()`, and `registerAgent()`.
- **`frontend/apps/cli/src/index.ts`**:
  - Expose the new command: `identity.command("init")`.
  - Add required options: `--api-url`, `--tenant-id`, `--agent-id`, `--app-token`.

---

## 2. Support JSON Output as Default

**Goal**: Ensure all standard CLI output is printed as structured JSON to facilitate programmatic integration.

**Changes**:
- **`frontend/apps/cli/src/utils/output.ts` (New)**:
  - Create a utility function `printOutput(data: any)` that outputs `JSON.stringify(data, null, 2)` to `stdout`.
  - Create a logging utility `logMessage(message: string)` that outputs to `stderr` so it doesn't pollute the JSON stdout.
- **Update Commands (`identity.ts`, `secrets.ts`, `admin.ts`)**:
  - Refactor existing `console.log(...)` statements.
  - Human-readable progress messages (e.g., "Deriving Master Key...") should be moved to `stderr` using `console.error()` or a new logger, or removed if the command succeeds silently and outputs JSON at the end.
  - Final results (e.g., secret values, lists of agents, request status) should be formatted as a JSON object and printed to `stdout`.
- **Update Error Handler (`frontend/apps/cli/src/utils/error-handler.ts`)**:
  - Refactor `handleError` to output a structured JSON error object (e.g., `{"error": true, "message": "...", "status": 401, "code": "..."}`) to `stdout` or `stderr`, ensuring consistency.

---

## 3. Write Automated Tests

**Goal**: Verify that the new `init` command works correctly and that outputs are valid JSON.

**Changes**:
- **`frontend/apps/cli/test/e2e/cli.test.ts`** (or create a specific test file like `init-command.test.ts` and `output-format.test.ts`):
  - Mock the `VaultClient` and file system.
  - **Test `init`**: Assert that it correctly saves the config, generates keys, and registers the agent with the mocked API.
  - **Test JSON Output**: Assert that executing commands like `get-secret` or `admin agent list` outputs valid, parseable JSON strings.
  - **Test Error Output**: Assert that failing commands output valid JSON error structures.