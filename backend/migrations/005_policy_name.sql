-- Add policy_name (internal/slug-style name) separate from display title
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS policy_name character varying(200);

UPDATE policies
SET policy_name = title
WHERE policy_name IS NULL;

ALTER TABLE policies
  ALTER COLUMN policy_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_policies_policy_name_lower
  ON policies (lower(policy_name::text))
  WHERE is_deleted = false;

INSERT INTO schema_migrations (version)
VALUES ('005_policy_name.sql')
ON CONFLICT (version) DO NOTHING;
