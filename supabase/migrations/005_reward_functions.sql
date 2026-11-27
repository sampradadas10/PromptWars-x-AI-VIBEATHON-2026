-- PHYGITAL — 005_reward_functions.sql
-- Server-side authoritative XP, level, and badge functions + initial badge seed.

INSERT INTO public.badges (badge_code, badge_name, description) VALUES
  ('NATURE_DETECTIVE', 'Nature Detective', 'Completed real-world outdoor or natural object observations.'),
  ('MINI_SCIENTIST', 'Mini Scientist', 'Conducted a safe hands-on discovery in the Potion & Gadget Lab.'),
  ('STORY_KEEPER', 'Story Keeper', 'Preserved an intergenerational family story in English.'),
  ('WORD_WIZARD', 'Word Wizard', 'Practiced English storytelling, reading, or vocabulary.'),
  ('FAMILY_EXPLORER', 'Family Explorer', 'Interviewed a parent, grandparent, or elder about heritage.'),
  ('EVERYDAY_HERO', 'Everyday Hero', 'Completed real-world helpful habits and tidy-up quests.'),
  ('SCREEN_FREE_CHAMPION', 'Screen-Free Champion', 'Powered up the Offline Sun-Battery away from the screen.'),
  ('CURIOUS_MIND', 'Curious Mind', 'Taught Leo and Maya a concept through Reverse Tutoring.'),
  ('CREATIVE_STORYTELLER', 'Creative Storyteller', 'Wrote or told an original adventure story in English.'),
  ('DISCOVERY_MASTER', 'Discovery Master', 'Earned 250 XP or completed 5 real-world adventures!')
ON CONFLICT (badge_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(p_total_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, (GREATEST(0, p_total_xp) / 100) + 1);
$$;

CREATE OR REPLACE FUNCTION public.award_quest_xp(
  p_child_id UUID,
  p_quest_zone TEXT,
  p_quest_title TEXT,
  p_quest_type TEXT,
  p_ai_summary TEXT DEFAULT '',
  p_parent_quest_id UUID DEFAULT NULL
)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, xp_awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp INTEGER;
  v_total INTEGER;
  v_level INTEGER;
BEGIN
  IF p_parent_quest_id IS NOT NULL THEN
    SELECT LEAST(30, GREATEST(10, reward_xp)) INTO v_xp
    FROM public.parent_quests
    WHERE id = p_parent_quest_id AND child_id = p_child_id;

    UPDATE public.parent_quests
    SET status = 'completed'
    WHERE id = p_parent_quest_id AND child_id = p_child_id;
  END IF;

  IF v_xp IS NULL THEN
    v_xp := CASE p_quest_type
      WHEN 'simple' THEN 10
      WHEN 'discovery' THEN 20
      WHEN 'speaking' THEN 25
      WHEN 'family' THEN 30
      WHEN 'offline' THEN 30
      WHEN 'habit' THEN 15
      ELSE 10
    END;
  END IF;

  INSERT INTO public.quest_progress (child_id, quest_zone, quest_title, status, ai_evaluation_summary, xp_awarded)
  VALUES (p_child_id, p_quest_zone, p_quest_title, 'completed', COALESCE(p_ai_summary, ''), v_xp);

  UPDATE public.child_profiles
  SET total_xp = total_xp + v_xp,
      level = public.calculate_level_from_xp(total_xp + v_xp),
      sun_battery_level = CASE
        WHEN p_quest_type = 'offline' THEN LEAST(100, sun_battery_level + 25)
        ELSE sun_battery_level
      END
  WHERE id = p_child_id
  RETURNING total_xp, level INTO v_total, v_level;

  RETURN QUERY SELECT v_total, v_level, v_xp;
END;
$$;
