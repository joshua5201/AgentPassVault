ALTER TABLE leases ADD COLUMN public_key TEXT;

-- Update existing leases with the current public key of the agent
UPDATE leases l
JOIN users u ON l.agent_id = u.id
SET l.public_key = u.public_key
WHERE l.public_key IS NULL AND u.public_key IS NOT NULL;

-- For any leases that still have NULL public_key (because the agent didn't have one),
-- we delete them as they are invalid leases without a public key to encrypt for.
DELETE FROM leases WHERE public_key IS NULL;

-- Now we can safely set NOT NULL
ALTER TABLE leases MODIFY COLUMN public_key TEXT NOT NULL;