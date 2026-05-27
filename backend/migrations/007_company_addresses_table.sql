-- Normalized company addresses (one row per company)
CREATE TABLE IF NOT EXISTS company_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  address_line_1 character varying(255),
  city character varying(100),
  state character varying(100),
  country character varying(100),
  pin_code character varying(20),
  formatted_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_addresses_company_id
  ON company_addresses (company_id);

-- Migrate from inline columns on companies (if present)
INSERT INTO company_addresses (
  company_id,
  address_line_1,
  city,
  state,
  country,
  pin_code,
  formatted_address
)
SELECT
  c.id,
  c.street_address AS address_line_1,
  c.city,
  c.state,
  c.country,
  c.pin_code,
  NULLIF(TRIM(c.address), '')
FROM companies c
WHERE c.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM company_addresses ca WHERE ca.company_id = c.id
  )
  AND (
    NULLIF(TRIM(COALESCE(c.street_address, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(c.city, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(c.state, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(c.country, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(c.pin_code, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(c.address, '')), '') IS NOT NULL
  );

UPDATE company_addresses ca
SET formatted_address = TRIM(BOTH ', ' FROM CONCAT_WS(
  ', ',
  NULLIF(TRIM(ca.address_line_1), ''),
  NULLIF(TRIM(ca.city), ''),
  NULLIF(TRIM(ca.state), ''),
  NULLIF(TRIM(ca.country), ''),
  NULLIF(TRIM(ca.pin_code), '')
))
WHERE formatted_address IS NULL OR TRIM(formatted_address) = '';

ALTER TABLE companies
  DROP COLUMN IF EXISTS street_address,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS pin_code;

-- Keep legacy address column optional; drop if empty usage
ALTER TABLE companies DROP COLUMN IF EXISTS address;

INSERT INTO schema_migrations (version)
VALUES ('007_company_addresses_table.sql')
ON CONFLICT (version) DO NOTHING;
