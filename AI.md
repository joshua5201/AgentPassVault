# Agent Rules & Instructions

Agents working on this project must adhere to the specifications and workflows defined in [DESIGN.md](./DESIGN.md).

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
- **Feature Branches:** Always create a new feature branch (e.g., `feat/my-feature`) for development work. Do not commit directly to `master`. Avoid generic branch names like `feat/java-implementation`; prefer specific, feature-driven names (e.g., `feat/secret-visibility-lease`).
- **Merge Strategy:** When merging to `master`, always use the `--no-ff` (no fast-forward) option to preserve the branch topology.

## Java Implementation Context (feat/java)
- **Primary Branch:** `feat/java` is the main development branch for the Java implementation.
- **Feature Branching:** Until a new working version is finished, all new work must branch out from `feat/java`.
- **Architecture:** Spring Boot 3 (Java 21) + MongoDB.
- **Security:** Multi-tenant isolation using 2-tier key hierarchy (SMK + TK).
- **Coding Standards:** NEVER use `java.util.Date`. Always use `java.time` APIs (e.g., `Instant`, `LocalDateTime`, `OffsetDateTime`).

## License Header
- For all `.java` files, the license header from `licence-header.txt` must be present at the top of the file.
