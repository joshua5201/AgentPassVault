# Agent Rules & Instructions

Agents working on this project must adhere to the specifications and workflows defined in [DESIGN.md](./DESIGN.md).

## Core Requirements
- Always verify secret retrieval patterns against the "Missing Secret Flow".
- Ensure all API implementations match the "Human-in-the-Loop" request-response model.
- Maintain security standards for encryption and audit logging as defined in the design document.
- **Documentation Only Mode:** When a prompt starts with "doc:", only modify markdown (`.md`) files. Do not write or modify any source code.
- **Section Preservation:** Never remove existing sections or placeholders in `DESIGN.md` unless explicitly instructed. Always perform a full review of the document after a `replace` operation to ensure no content was lost.

## Development Workflow
- **Big Structure First:** Always define the high-level architecture, file structure, and data models before implementing detailed logic.
- **Automatic Test Verification:** Upon completing implementation, write comprehensive automated tests (unit and integration) to verify the new features.
- **Feature Branches:** Always create a new feature branch (e.g., `feat/my-feature`) for development work. Do not commit directly to `master`.
- **Merge Strategy:** When merging to `master`, always use the `--no-ff` (no fast-forward) option to preserve the branch topology.
