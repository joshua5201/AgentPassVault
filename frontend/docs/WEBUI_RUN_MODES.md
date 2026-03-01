# Web UI Run Modes

This document defines the supported frontend run modes for local development and validation.

## 1) Pure UI Mock Mode

Use this to validate UI behavior without backend dependency.

```bash
cd frontend
./start_pure_ui_mock_vite.sh
```

Defaults:
- `VITE_API_MOCKING=true`
- `VITE_API_CLIENT_FALLBACK=true`
- `VITE_API_URL=http://localhost:8080`
- web: `http://localhost:5173`

## 2) Integration Backend Mode (Local)

Use this when backend integration stack is running on host `58080`.

```bash
cd frontend
./start_integration_vite.sh
```

Defaults:
- `VITE_API_MOCKING=false`
- `VITE_API_CLIENT_FALLBACK=false`
- `VITE_API_URL=http://localhost:58080`
- `VITE_API_PROXY=true` (same-origin `/api` via Vite proxy)
- web: `http://localhost:5174`

Dev LAN behavior:
- In dev mode, if API host is `localhost` or `127.0.0.1`, the frontend rewrites it to the browser host.
- Example: browsing from iPad at `http://192.168.1.101:5174` makes API calls to `http://192.168.1.101:58080`.

## 3) Staging API Mode

Use this to validate against staging API contracts.

```bash
cd frontend
./start_staging_vite.sh
```

Defaults:
- `VITE_API_MOCKING=false`
- `VITE_API_CLIENT_FALLBACK=false`
- `VITE_API_URL=https://api-staging.agentpassvault.com`
- `VITE_API_PROXY=true` (same-origin `/api` via Vite proxy)
- web: `http://localhost:5175`

## 4) HTTPS Mock Mode (iPad / WebCrypto)

Use this for secure-context browser behavior with local certificate.

```bash
cd frontend
./start_https_mocked_vite.sh
```

Defaults:
- stable self-signed cert under `frontend/vite-proxy/certs`
- mock mode enabled
- web: `https://localhost:5173`

## DTO Sync Workflow (Phase 7)

When backend API contracts change:

```bash
cd frontend
pnpm sync-dtos
```

This delegates to:
- backend OpenAPI generation
- `./scripts/management/sync-dtos.sh`

Do not manually edit generated files under `frontend/packages/sdk/src/api/generated`.
