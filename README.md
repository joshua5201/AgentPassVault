# AgentVault

AgentVault is a lightweight, standalone password and secret manager designed for automated agents. It bridges the gap between autonomous agents and secure credential management by allowing agents to retrieve secrets and request new ones from human admins asynchronously.

## 🚀 Features
- **Agent-Centric API**: Designed for machine consumption.
- **Secure by Default**: Secrets are encrypted at rest (AES-256 GCM) with tenant isolation.
- **Request-Response Workflow**: Agents "ask" for secrets; Admins fulfill them securely.
- **Audit Ready**: Tracks secret creation and access.

## 🛠️ Development Setup

### Prerequisites
- Java 21
- Docker & Docker Compose

### Quick Start
1.  **Start Infrastructure (MongoDB):**
    ```bash
    docker-compose up -d
    ```
2.  **Run the Application (Dev Profile):**
    ```bash
    ./gradlew bootRun
    ```
    *This will auto-seed a "Dev Tenant" and "devadmin" user.*

3.  **Get Credentials:**
    ```bash
    ./get-dev-tenant.sh
    # Outputs: Tenant ID and Username
    ```

## 🔑 Security Setup (Production)

AgentVault uses a 2-tier key hierarchy (SMK + TK).

### 1. Generate the System Master Key (SMK)
Generate a 32-byte Base64 key:
```bash
openssl rand -base64 32
```

### 2. Generate JWT Secret
Generate a strong secret for signing JWTs:
```bash
openssl rand -base64 64
```

### 3. Environment Configuration
Set these environment variables (or use `.env` file):
```bash
export AGENTVAULT_SYSTEM_KEY="your-smk..."
export AGENTVAULT_JWT_SECRET="your-jwt-secret..."
```

## 📚 API Overview

### Authentication
- `POST /api/v1/auth/login`: Admin (user/pass) or Agent (app_token) login. Returns JWT.
- `POST /api/v1/auth/change-password`: Change password.
- `POST /api/v1/auth/forgot-password`: Initiate reset flow.

### Secrets (Encrypted)
- `POST /api/v1/secrets/search`: Search by metadata (e.g., `{"metadata.env": "prod"}`). Returns metadata only.
- `GET /api/v1/secrets/{id}`: Retrieve decrypted secret value.
- `POST /api/v1/secrets`: Create a secret.
- `DELETE /api/v1/secrets/{id}`: Delete a secret.

### Requests (The "Ask" Pattern)
- `POST /api/v1/requests`: Agent creates a request for a missing secret.
- `GET /api/v1/requests/{id}`: Check status.
- `POST /api/v1/requests/{id}/fulfill`: Admin provides the secret.
- `POST /api/v1/requests/{id}/reject`: Admin denies request.

### Agents
- `POST /api/v1/agents`: Create a new agent (returns app_token).
- `GET /api/v1/agents`: List agents.
- `POST /api/v1/agents/{id}/rotate`: Rotate app_token.

## 🧪 Testing
Run unit and integration tests:
```bash
./gradlew test
```
Includes an End-to-End test `MissingSecretFlowTest` simulating the full Agent-Admin interaction loop.
