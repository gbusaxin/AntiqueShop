CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           TEXT        PRIMARY KEY,
  provider     TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events (processed_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_admin_only"
  ON public.webhook_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
