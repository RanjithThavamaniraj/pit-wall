-- PitWall self-hosted analytics (Supabase / PostgreSQL)
-- Run manually in the Supabase SQL Editor. Do not auto-execute from the app.

-- ─── Events (pageviews + heartbeats) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('pageview', 'heartbeat')),
  timestamp_ms BIGINT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  pathname TEXT NOT NULL,
  sport TEXT NOT NULL,
  route_bucket TEXT NOT NULL,
  referrer_bucket TEXT NOT NULL,
  device TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp_ms
  ON analytics_events (timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp
  ON analytics_events (type, timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
  ON analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_timestamp
  ON analytics_events (visitor_id, timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_pathname
  ON analytics_events (pathname);

-- ─── API route metrics ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_api_metrics (
  id UUID PRIMARY KEY,
  timestamp_ms BIGINT NOT NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_api_metrics_timestamp_ms
  ON analytics_api_metrics (timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_api_metrics_route_timestamp
  ON analytics_api_metrics (route, timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_api_metrics_status
  ON analytics_api_metrics (status)
  WHERE status >= 500;

-- ─── Session rollups (future dashboards / retention) ─────────────────────────

CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  first_seen_ms BIGINT NOT NULL,
  last_seen_ms BIGINT NOT NULL,
  pageview_count INTEGER NOT NULL DEFAULT 0,
  total_duration_ms BIGINT NOT NULL DEFAULT 0,
  last_pathname TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_seen_ms
  ON analytics_sessions (last_seen_ms DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor_id
  ON analytics_sessions (visitor_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Service role (server) bypasses RLS. No public read/write policies.

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Future authenticated admin read example (uncomment when admin JWT is wired):
-- CREATE POLICY "admin_read_analytics_events"
--   ON analytics_events FOR SELECT
--   TO authenticated
--   USING (auth.jwt() ->> 'role' = 'admin');
