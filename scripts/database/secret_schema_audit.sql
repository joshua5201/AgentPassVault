-- Issue #44 phase3 pre-check audit
-- Usage:
--   mysql < scripts/database/secret_schema_audit.sql

SELECT COUNT(*) AS null_schema_count
FROM secrets
WHERE secret_schema IS NULL;

SELECT id, name, tenant_id
FROM secrets
WHERE secret_schema IS NULL
ORDER BY id
LIMIT 100;
