-- Activity logs (Postgres source of truth; synced to Elasticsearch when enabled)
CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category      VARCHAR(40) NOT NULL,
  action        VARCHAR(60) NOT NULL,
  severity      VARCHAR(10) NOT NULL DEFAULT 'info',
  message       TEXT NOT NULL,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_email   VARCHAR(150),
  actor_role    VARCHAR(50),
  target_type   VARCHAR(50),
  target_id     VARCHAR(64),
  target_label  VARCHAR(200),
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  es_synced_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_occurred_at ON activity_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs (category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_email ON activity_logs (LOWER(actor_email));
CREATE INDEX IF NOT EXISTS idx_activity_logs_unsynced ON activity_logs (occurred_at) WHERE es_synced_at IS NULL;
