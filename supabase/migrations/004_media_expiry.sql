-- PHYGITAL — 004_media_expiry.sql
-- Configures pg_cron + pg_net to invoke the purge-expired-media Edge Function every 5 minutes.
-- Also provides an SQL view for non-expired items with exact remaining seconds.

CREATE OR REPLACE VIEW public.active_ephemeral_media_status AS
SELECT
  emv.id,
  emv.child_id,
  emv.quest_id,
  emv.media_type,
  emv.storage_bucket_path,
  emv.created_at,
  emv.expires_at,
  GREATEST(0, EXTRACT(EPOCH FROM (emv.expires_at - NOW()))::INTEGER) AS seconds_remaining
FROM public.ephemeral_media_vault emv
WHERE NOW() < emv.expires_at;

-- Enable pg_cron and pg_net extensions where supported by Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule purge-expired-media every 5 minutes.
-- Replace <PROJECT_REF> and configure vault secret 'service_role_key' in Supabase Vault before deploying.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('phygital-purge-expired-media')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'phygital-purge-expired-media'
    );

    PERFORM cron.schedule(
      'phygital-purge-expired-media',
      '*/5 * * * *',
      $cron$
      SELECT net.http_post(
        url := current_setting('app.supabase_functions_url', true) || '/purge-expired-media',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := '{"source":"pg_cron"}'::jsonb
      );
      $cron$
    );
  END IF;
END $$;
