# Web UI Operator Runbook

## Preconditions

1. Install dependencies:
```bash
cd frontend
pnpm install
```
2. For integration mode, start backend stack separately (`http://localhost:58080`).

## Daily Workflow

1. Start one mode:
   - pure mock: `./start_pure_ui_mock_vite.sh`
   - integration local: `./start_integration_vite.sh`
   - staging: `./start_staging_vite.sh`
2. Open the announced URL in browser.
3. Login with test credentials in mock mode:
   - username: `vault-admin+mock@agentpassvault.local`
   - password: `MockMasterPass!2026#LocalOnly`
   - optional 2FA code (mock): `123456`

## Verification Checklist (Phase 8 Manual)

1. Login/logout:
   - login succeeds and lands on `Pending Requests`
   - logout returns to login page
2. Fulfill/reject:
   - map existing secret flow marks request `fulfilled`
   - create+lease flow marks request `fulfilled`
   - reject flow marks request `rejected`
3. Secret create + lease:
   - plaintext input accepted in UI
   - request payload contains encrypted value only
4. Failure + retries:
   - use MSW forced errors (`mockError=500`) and verify error toast
5. Vault security:
   - lock hides reveal values and blocks secret create
   - unlock with correct password restores actions

## Automated Verification Commands

```bash
cd frontend
pnpm --filter @agentpassvault/web lint
pnpm --filter @agentpassvault/web test:unit
```

E2E on isolated port:
```bash
cd frontend/apps/web
PW_BASE_URL=http://127.0.0.1:5176 \
PW_WEBSERVER_COMMAND='VITE_API_MOCKING=true VITE_API_CLIENT_FALLBACK=true pnpm exec vite --host 127.0.0.1 --port 5176 --strictPort' \
pnpm test:e2e
```
