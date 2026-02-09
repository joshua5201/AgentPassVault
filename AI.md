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

## Java Implementation Note
- **Coding Standards:** NEVER use `java.util.Date`. Always use `java.time` APIs (e.g., `Instant`, `LocalDateTime`, `OffsetDateTime`).

## Frontend Implementation Context
- **Directory:** `frontend/`
- **Git Restriction:** **NEVER push to origin.** All changes must remain local.
- **License:** **GPLv3**. We may refer to Bitwarden's GPL-licensed logic for encryption/decryption and formats.
- **Bitwarden Restriction:** **NEVER** refer to or use code from `bitwarden_license/` (Commercial Modules). This is enforced via `.geminiignore`.
- **Architecture:** Monorepo using Turborepo + PNPM.
- **Detailed Plan:** [Frontend Implementation Plan](./docs/frontend-implementation-plan.md)
- **Implementation Status:**
    - [x] **SDK - Models:** Core interfaces for Secrets, Leases, Requests - Finished.
    - [x] **SDK - Crypto:** `MasterKeyService` (PBKDF2 derivation) - Finished.
    - [x] **SDK - Crypto:** `CryptoService` (Symmetric AES-CBC+HMAC, Asymmetric RSA-OAEP) - Finished.
    - [x] **SDK - Crypto:** `CipherStringParser` (Type 2 support) - Finished.
    - [x] **SDK - Services:** `SecretService` (Local secret management) - Finished.
    - [x] **SDK - Services:** `LeaseService` (Agent re-encryption logic) - Finished.
    - [x] **SDK - API:** Client-side API definitions and request handling - Finished.
    - [x] **CLI:** Agent CLI implementation - Finished.
    - [ ] **Web:** Admin/Fulfillment UI - Pending.

## License Header
- For all `.java` files, the license header from `licence-header.txt` must be present at the top of the file.

## Development tips
- Find useful scripts under scripts/
- Always use flyway to create new field. Don't modify existing flyway migrations that are already committed
- Use scripts/database/flyway.sh to do flyway operations
