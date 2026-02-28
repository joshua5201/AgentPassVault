# Web UI Next Sprint Gaps

## Functional Gaps

1. Agent CRUD UI is not implemented (list-only data path exists).
2. Audit log UI is still missing.
3. Advanced auth policies are partial:
   - no mandatory 2FA policy enforcement UI
   - no account recovery / password reset UX

## Integration Gaps

1. Staging contract drift must be validated after each DTO sync.
2. Request fulfillment E2E currently mock-first; backend-coupled E2E is pending.

## Hardening Gaps

1. Add component-level tests for forms and fulfillment widgets.
2. Add CI profile that runs web E2E in both mock and integration modes.
3. Add stronger telemetry/redaction policy for client-side error reporting.
