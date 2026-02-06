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
./scripts/database/flyway.sh migrate
```

### 3. Run the Application
```bash
./run_dev_app.sh
```
The API will be available at `http://localhost:8080`.

## License
This project is licensed under the **GNU Affero General Public License v3.0**. See the `LICENSE` file for details.
All source files must contain the standard AGPL v3.0 license header.
