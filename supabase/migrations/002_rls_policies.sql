-- PHYGITAL — 002_rls_policies.sql
-- Strict Row-Level Security enforcing parent-child ownership and 48-hour expiry cutoff.

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ephemeral_media_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_purge_audit ENABLE ROW LEVEL SECURITY;

-- child_profiles: parents manage only their own children
CREATE POLICY "Parents select own child profiles"
  ON public.child_profiles FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents insert own child profiles"
  ON public.child_profiles FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents update own child profiles"
  ON public.child_profiles FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents delete own child profiles"
  ON public.child_profiles FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- parental_controls
CREATE POLICY "Parents manage controls for own children"
  ON public.parental_controls FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = parental_controls.child_id AND cp.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = parental_controls.child_id AND cp.parent_id = auth.uid()
    )
  );

-- quest_progress
CREATE POLICY "Parents view and insert quest progress for own children"
  ON public.quest_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = quest_progress.child_id AND cp.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents insert quest progress for own children"
  ON public.quest_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = quest_progress.child_id AND cp.parent_id = auth.uid()
    )
  );

-- parent_quests
CREATE POLICY "Parents manage assigned quests for own children"
  ON public.parent_quests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = parent_quests.child_id AND cp.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = parent_quests.child_id AND cp.parent_id = auth.uid()
    )
  );

-- badges (public read for authenticated users)
CREATE POLICY "Authenticated users read badge catalog"
  ON public.badges FOR SELECT
  TO authenticated
  USING (TRUE);

-- child_badges
CREATE POLICY "Parents view unlocked badges for own children"
  ON public.child_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_badges.child_id AND cp.parent_id = auth.uid()
    )
  );

-- ephemeral_media_vault:
-- 1) Immediate access cutoff after 48-hour expiry (NOW() < expires_at)
-- 2) Prevent clients from tampering with created_at or expires_at via trigger
CREATE POLICY "Parents view non-expired temporary media metadata for own children"
  ON public.ephemeral_media_vault FOR SELECT
  TO authenticated
  USING (
    NOW() < expires_at
    AND EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = ephemeral_media_vault.child_id AND cp.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents insert temporary media metadata for own children"
  ON public.ephemeral_media_vault FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = ephemeral_media_vault.child_id AND cp.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents delete own temporary media metadata"
  ON public.ephemeral_media_vault FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = ephemeral_media_vault.child_id AND cp.parent_id = auth.uid()
    )
  );

-- Prevent clients from setting custom created_at or updating timestamps on ephemeral_media_vault
CREATE OR REPLACE FUNCTION public.enforce_ephemeral_media_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ephemeral_media_timestamps ON public.ephemeral_media_vault;
CREATE TRIGGER trg_enforce_ephemeral_media_timestamps
  BEFORE INSERT OR UPDATE ON public.ephemeral_media_vault
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ephemeral_media_timestamps();
