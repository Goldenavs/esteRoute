-- ==============================================================================
-- Migration: 001_performance_indexes.sql
-- Description: Composite and spatial indexes to guarantee sub-millisecond query
--              speed on reports, spatial lookups, and triage results at scale.
-- ==============================================================================

-- 1. Fast filtering for active vs resolved reports by recency and priority score
-- Powers PublicEsteroStatusMap, MainCommandDashboard, and dispatch queues
CREATE INDEX IF NOT EXISTS idx_reports_status_created 
  ON public.reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_status_priority 
  ON public.reports (status, priority_score DESC NULLS LAST);

-- 2. Fast spatial coordinate indexing for map boundary and proximity lookups
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng 
  ON public.reports (latitude, longitude);

-- 3. Fast lookup by citizen / reporter ID (powers CitizenDashboard "My Reports")
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created 
  ON public.reports (reporter_id, created_at DESC);

-- 4. Fast lookup for tracking references (case search & direct URL lookups)
CREATE INDEX IF NOT EXISTS idx_reports_tracking_ref 
  ON public.reports (tracking_reference);

-- 5. Fast lookup for agent_results by report_id and agent_type
CREATE INDEX IF NOT EXISTS idx_agent_results_report_type 
  ON public.agent_results (report_id, agent_type);

-- 6. Fast lookup for dispatch status history audit log
CREATE INDEX IF NOT EXISTS idx_dispatch_log_report_created 
  ON public.dispatch_status_log (report_id, created_at DESC);


-- 7. Realtime Replication for instant UI synchronization (triage and status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'agent_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_results;
  END IF;
END $$;
