UPDATE secrets
SET secret_schema = JSON_OBJECT(
    'template', 'legacy',
    'version', 1,
    'source', 'migration-v10'
)
WHERE secret_schema IS NULL;
