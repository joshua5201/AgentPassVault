# Web UI Run Modes

This document defines the supported frontend run modes for local development and validation.

## 1) Unified Launcher

Use one script with two modes:

```bash
cd frontend
./start_vite.sh mocked
./start_vite.sh real
```

- `mocked`: UI-only flow using local mocked API
- `real`: backend API flow (defaults to staging)
- HTTPS is enabled by default (`VITE_DEV_HTTPS=true`)
- Disable HTTPS if needed: `VITE_DEV_HTTPS=false ./start_vite.sh <mode>`

Backend host configuration for `real` mode:
- `VITE_API_URL` (highest priority)
- `AGENTPASSVAULT_API_URL` (CLI-style override)
- default: `https://api-staging.agentpassvault.com`

## 2) Mocked Mode

Use this to validate UI behavior without backend dependency.

```bash
cd frontend
./start_vite.sh mocked
```

Defaults:
- `VITE_API_MOCKING=true`
- `VITE_API_CLIENT_FALLBACK=true`
- `VITE_API_PROXY=false`
- `VITE_API_URL=http://localhost:8080`
- web: `https://localhost:5173`

## 3) Real Backend Mode

Use this for local integration backend or staging.

```bash
cd frontend
./start_vite.sh real
```

Defaults:
- `VITE_API_MOCKING=false`
- `VITE_API_CLIENT_FALLBACK=false`
- `VITE_API_URL=https://api-staging.agentpassvault.com` (or env override)
- `VITE_API_PROXY=true` (same-origin `/api` via Vite proxy)
- web: `https://localhost:5173`

Local integration backend example:

```bash
cd frontend
AGENTPASSVAULT_API_URL=http://localhost:58080 ./start_vite.sh real
```

Dev LAN behavior:
- In dev mode, if API host is `localhost` or `127.0.0.1`, the frontend rewrites it to the browser host.
- Example: browsing from iPad at `https://192.168.1.101:5173` makes API calls to `http://192.168.1.101:58080`.

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
