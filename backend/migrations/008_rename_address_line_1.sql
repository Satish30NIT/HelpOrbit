ALTER TABLE company_addresses
  RENAME COLUMN street_address TO address_line_1;

INSERT INTO schema_migrations (version)
VALUES ('008_rename_address_line_1.sql')
ON CONFLICT (version) DO NOTHING;
