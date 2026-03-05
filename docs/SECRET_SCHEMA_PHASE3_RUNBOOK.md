# Secret Schema Phase 3 Migration Runbook

## Goal
Move `secrets.secret_schema` from nullable to required safely.

## Migrations
- `V10__backfill_secret_schema_for_existing_rows.sql`
- `V11__make_secret_schema_not_null.sql`

## Pre-check
Run before deploy:

```sql
SELECT COUNT(*) AS null_schema_count
FROM secrets
WHERE secret_schema IS NULL;
```

Optional sampling:

```sql
SELECT id, name, tenant_id
FROM secrets
WHERE secret_schema IS NULL
ORDER BY id
LIMIT 100;
```

## Backfill strategy
Any row with `secret_schema IS NULL` is backfilled to:

```json
{"template":"legacy","version":1,"source":"migration-v10"}
```

This is deterministic and reversible by value match.

## Deploy steps
1. Deploy code including DTO validation + service checks.
2. Run Flyway migrations (V10 then V11).
3. Verify no nullable schema rows remain.

## Post-check

```sql
SELECT COUNT(*) AS null_schema_count
FROM secrets
WHERE secret_schema IS NULL;
```

Expected: `0`

Schema constraint check:

```sql
SHOW CREATE TABLE secrets;
```

Expected: `secret_schema` defined as `JSON NOT NULL`.

## Rollback notes
- DB rollback requires manual DDL change if you must re-allow null:

```sql
ALTER TABLE secrets MODIFY COLUMN secret_schema JSON NULL;
```

- Data backfill from V10 is non-destructive (only touches NULL values).
- Application rollback to pre-phase3 code is **not** compatible with strict required-schema API behavior unless coordinated.
