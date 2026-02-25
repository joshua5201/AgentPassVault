# AgentPassVault

> [!IMPORTANT]
> This is a hobby project and is currently under active development.

**AgentPassVault** is a secure, standalone secret manager designed specifically for autonomous AI agents (like OpenClaw, formerly Moltbot, ClawdBot). It provides a bridge between human owners and automated workers, ensuring agents can access credentials without exposing sensitive data in chat logs or LLM context.

## Why AgentPassVault?
*   **Prevent Secret Leakage:** AI agents often need credentials. Sharing them directly in chat or system prompts is a massive security risk. AgentPassVault keeps secrets out of the LLM context.
*   **Asynchronous Approval:** Agents can request secrets they don't have. Humans fulfill these requests via a secure UI.
*   **Zero Knowledge:** The server never sees your plaintext secrets. Everything is encrypted/decrypted on the client side.

## How It Works

### 1. The "Ask" Pattern (Missing Secret)
When an agent needs a secret it doesn't have:
1.  **Agent Request:** The agent creates a request for a specific service (e.g., "AWS Production").
2.  **Human Notification:** The agent provides a secure link to the human: *"I need AWS credentials. Please provide them here: [LINK]"*.
3.  **Fulfillment:** The human clicks the link, enters the secret, and the agent is granted access via a secure lease.

### 2. The Lease Flow (Retreival)
Access is managed through **Leases**:
1.  **Public Key Auth:** Agents register a public key.
2.  **Encrypted Delivery:** The server provides secrets previous encrypted specifically by the **web client** for the agent's public key.
3.  **Local Decryption:** The Agent CLI tool decrypts the secret locally using the private key.
4.  **Rotation Integrity:** If a secret is updated or an agent rotates its key, old leases are invalidated.

## Why It Is Safe
AgentPassVault uses a **Zero-Knowledge Architecture**:
*   **Master Key:** Secrets are encrypted with a Master Key derived from the human's password (which never leaves the browser).
*   **Agent-Specific Encryption:** When a lease is created, the Web UI decrypts the secret and re-encrypts it with the agent's public key.
*   **No Plaintext on Server:** The database only stores data that the server itself cannot decrypt. Even if the server is compromised, your secrets remain safe.

## Quick Start (Local Dev)

### Prerequisites
*   Docker & Docker Compose
*   Java 21 (for native execution)

### 1. Start the Infrastructure
```bash
docker compose up -d
```

### 2. Setup Database

```bash
./scripts/database/flyway.sh
```

### 3. Run the Application
```bash
./run_dev_app.sh
```
The API will be available at `http://localhost:8080`.

## Frontend Development

The frontend is a TypeScript monorepo managed by **Turborepo** and **pnpm**. It consists of three main parts:
*   `packages/sdk`: The core cryptographic and API logic.
*   `apps/cli`: The `agentpassvault` command-line tool.
*   `apps/web`: The React-based administrator dashboard.

### Prerequisites
*   **Node.js**: Version 20 or higher.
*   **pnpm**: The package manager used for this project. Install via `npm install -g pnpm`.

### Core Commands (Run from the `frontend/` directory)

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install all dependencies for the entire monorepo. |
| `pnpm build` | Build all packages (SDK, CLI, Web). Includes linting and type-checking. |
| `pnpm clean` | Remove all build artifacts (`dist`, `.turbo`, `node_modules`). |
| `pnpm lint` | Run code quality and formatting checks. |
| `pnpm typecheck` | Run TypeScript compiler checks across all projects. |
| `pnpm test` | Run all unit tests. |
| `pnpm sync-dtos` | Re-generate the API contract from the Java backend. |

### Working with the Agent CLI

#### Local Execution
After building the project (`pnpm build`), you can run the CLI directly using Node.js without installing it globally:
```bash
cd frontend/apps/cli
node dist/index.js --help
```

#### Running Tests
The CLI has two types of tests:
*   **Unit Tests**: Logic tests that don't require a server.
    `pnpm test:unit`
*   **Integration (E2E) Tests**: Full lifecycle tests against the running Docker backend.
    `pnpm test:integration`

#### Global Link (Optional)
To make the `agentpassvault` command available everywhere on your system:
```bash
cd frontend/apps/cli
npm link
```

### Troubleshooting
If you encounter weird build errors or type mismatches after a git pull:
1. `pnpm clean`
2. `pnpm install`
3. `pnpm build`

## License & Commercial Usage

### Backend
The server side application is licensed under the **GNU Affero General Public License v3.0**. See the `LICENSE` file for details. All source files must contain the standard AGPL v3.0 license header.

For commercial inquiries, custom licensing terms, or enterprise support, please contact: `joshua841025 at gmail.com`

### Fronted (SDK, CLI, Web UI)

Licensed under the **GNU General Public License v3.0 (GPLv3)**. See the `frontend/LICENSE` file for details.

## Contributing
We welcome all contributions! To ensure legal clarity for all users, all contributors must agree to our [Contributor License Agreement (CLA)](CONTRIBUTING.md) when submitting a Pull Request.

All source files must contain the appropriate license header.
