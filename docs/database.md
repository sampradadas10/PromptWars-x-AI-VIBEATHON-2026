# PHYGITAL — Database Schema & Migrations

Deployable PostgreSQL migrations live in `supabase/migrations/`:

1. `001_initial_schema.sql`:
   - Permanent tables: `child_profiles`, `parental_controls`, `quest_progress`, `parent_quests`, `badges`, `child_badges`, `media_purge_audit`
   - Temporary table: `ephemeral_media_vault` with generated `expires_at` (`created_at + INTERVAL '48 hours'`) and `idx_ephemeral_media_expires_at`
2. `002_rls_policies.sql`:
   - Enables RLS on every table.
   - Enforces parent ownership (`parent_id = auth.uid()`).
   - Blocks reads on expired temporary media (`NOW() < expires_at`) and locks `created_at` against client modification via trigger `enforce_ephemeral_media_timestamps`.
3. `003_storage_setup.sql`:
   - Creates private `ephemeral-media` bucket (`public = FALSE`, 10 MB limit) with ownership and non-expired read policies.
4. `004_media_expiry.sql`:
   - Creates `active_ephemeral_media_status` view and schedules `pg_cron` job `phygital-purge-expired-media` every 5 minutes (`*/5 * * * *`).
5. `005_reward_functions.sql`:
   - Seeds the 10 PHYGITAL badges and installs `award_quest_xp` server-side RPC.
