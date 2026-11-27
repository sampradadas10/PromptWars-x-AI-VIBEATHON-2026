-- PHYGITAL — 001_initial_schema.sql
-- Separates permanent anonymized learning records from temporary user-generated media.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Permanent child profiles (never requires real full names)
CREATE TABLE IF NOT EXISTS public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK (char_length(trim(nickname)) BETWEEN 2 AND 24),
  age_group TEXT NOT NULL CHECK (age_group IN ('6-8', '9-11', '12-14')),
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  sun_battery_level INTEGER NOT NULL DEFAULT 35 CHECK (sun_battery_level BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON public.child_profiles(parent_id);

-- Permanent parental permission & feature controls
CREATE TABLE IF NOT EXISTS public.parental_controls (
  child_id UUID PRIMARY KEY REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  camera_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  microphone_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voice_capsules_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ar_habit_mirror_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  consent_accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permanent quest progress (anonymized learning summaries only, no raw media)
CREATE TABLE IF NOT EXISTS public.quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  quest_zone TEXT NOT NULL,
  quest_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  ai_evaluation_summary TEXT NOT NULL DEFAULT '',
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0 AND xp_awarded <= 50),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quest_progress_child_id ON public.quest_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_completed_at ON public.quest_progress(completed_at DESC);

-- Permanent parent-assigned real-world quests
CREATE TABLE IF NOT EXISTS public.parent_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 80),
  description TEXT NOT NULL CHECK (char_length(trim(description)) BETWEEN 5 AND 300),
  reward_xp INTEGER NOT NULL DEFAULT 15 CHECK (reward_xp BETWEEN 10 AND 30),
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  age_group TEXT NOT NULL DEFAULT '9-11' CHECK (age_group IN ('6-8', '9-11', '12-14')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_quests_child_id ON public.parent_quests(child_id);

-- Permanent badge catalog
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_code TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

-- Permanent unlocked badges per child
CREATE TABLE IF NOT EXISTS public.child_badges (
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (child_id, badge_id)
);

-- Temporary 48-hour ephemeral media metadata vault
CREATE TABLE IF NOT EXISTS public.ephemeral_media_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  quest_id UUID NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'before_after')),
  storage_bucket_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '48 hours') STORED
);

CREATE INDEX IF NOT EXISTS idx_ephemeral_media_expires_at
  ON public.ephemeral_media_vault(expires_at);
CREATE INDEX IF NOT EXISTS idx_ephemeral_media_child_id
  ON public.ephemeral_media_vault(child_id);

-- Non-identifying operational purge audit log (aggregate counts only)
CREATE TABLE IF NOT EXISTS public.media_purge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_found_count INTEGER NOT NULL DEFAULT 0,
  storage_deleted_count INTEGER NOT NULL DEFAULT 0,
  metadata_deleted_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);
