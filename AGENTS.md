# Agent Rules & Instructions

Agents working on this project must adhere to the specifications and workflows defined in [DESIGN.md](./docs/DESIGN.md).

## Core Requirements
- Always verify secret retrieval patterns against the "Missing Secret Flow".
- Ensure all API implementations match the "Human-in-the-Loop" request-response model.
- Maintain security standards for encryption and audit logging as defined in the design document.
- **Secret Size Limit:** Enforce a maximum of **64 KB** for encrypted secret values and **8 KB** for combined metadata to prevent service misuse as storage.
- **Idempotency:** Support `Idempotency-Key` header for all `POST` and `PATCH` requests to prevent duplicate record creation.
- **Documentation Only Mode:** When a prompt starts with "doc:", only modify markdown (`.md`) files. Do not write or modify any source code.
- **Section Preservation:** Never remove existing sections or placeholders in `DESIGN.md` unless explicitly instructed. Always perform a full review of the document after a `replace` operation to ensure no content was lost.

## Development Workflow
- **Big Structure First:** Always define the high-level architecture, file structure, and data models before implementing detailed logic.
- **Automatic Test Verification:** Upon completing implementation, write comprehensive automated tests (unit and integration) to verify the new features.
- **Feature Branches:** Always create a new feature branch (e.g., `feat/my-feature`) for development work. Do not commit directly to `master`. Avoid generic branch names like `feat/java-implementation`; prefer specific, feature-driven names (e.g., `feat/agent-self-registration`).
- **Merge Strategy:** When merging to `master`, always use the `--no-ff` (no fast-forward) option to preserve the branch topology.

## Local Development (Quick Start)
- **Build backend Docker image:** `./gradlew jibDockerBuild`
- **Start integration stack:** `docker compose up -d --force-recreate`
  - Exposes backend at `http://localhost:58080`
  - MySQL binds to `${MYSQL_PORT_3306:-53306}` on host
- **Run Flyway (if needed):** `./scripts/database/flyway.sh`

## Tests
- **Backend targeted tests:** `./gradlew test --tests <TestClass>`
  - Example: `./gradlew test --tests com.agentpassvault.controller.SecretControllerTest`
- **Frontend unit tests (all apps):** `cd frontend && pnpm test:unit`
- **Frontend integration tests (CLI E2E):** `cd frontend && pnpm test:integration`
  - Requires the backend integration stack running (`docker compose up -d --force-recreate`)

## Java Implementation Note
- **Coding Standards:** NEVER use `java.util.Date`. Always use `java.time` APIs (e.g., `Instant`, `LocalDateTime`, `OffsetDateTime`).

## Frontend Implementation Context
- **Directory:** `frontend/`
- **Git Restriction:** **NEVER push to origin.** All changes must remain local.
- **License:** **GPLv3**. We may refer to Bitwarden's GPL-licensed logic for encryption/decryption and formats.
- **Bitwarden Restriction:** **NEVER** refer to or use code from `bitwarden_license/` (Commercial Modules). This is enforced via `.geminiignore`.
- **Architecture:** Monorepo using Turborepo + PNPM.
- **Frontend Plan:** The initial implementation plan has been completed. Do not rely on a separate plan document unless explicitly provided for new work.

## DTO Generation
- **NEVER** manually create or modify TypeScript DTOs in `frontend/packages/sdk/src/api/generated`.
- **ALWAYS** use the synchronization script: `./scripts/management/sync-dtos.sh`.
- This script generates `openapi.yaml` from the Java backend and then runs `openapi-generator` to update the frontend SDK.

## License Header
- For all `.java` files, the license header from `licence-header.txt` must be present at the top of the file.

## Development tips
- Find useful scripts under scripts/
- Always use flyway to create new field. Don't modify existing flyway migrations that are already committed
- Use scripts/database/flyway.sh to do flyway operations
