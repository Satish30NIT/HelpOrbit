-- Structured company address fields
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS street_address character varying(255),
  ADD COLUMN IF NOT EXISTS city character varying(100),
  ADD COLUMN IF NOT EXISTS state character varying(100),
  ADD COLUMN IF NOT EXISTS country character varying(100),
  ADD COLUMN IF NOT EXISTS pin_code character varying(20);

-- Backfill from legacy single-line address
UPDATE companies
SET street_address = address
WHERE address IS NOT NULL
  AND TRIM(address) <> ''
  AND (street_address IS NULL OR TRIM(street_address) = '');

INSERT INTO schema_migrations (version)
VALUES ('006_company_address_fields.sql')
ON CONFLICT (version) DO NOTHING;
