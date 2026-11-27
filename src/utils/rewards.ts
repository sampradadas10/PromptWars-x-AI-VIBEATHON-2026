import type {
  AgeBandLabel,
  AgeGroup,
  BadgeDefinition,
  ChildBadge,
  QuestDefinition,
  QuestProgressRecord,
} from '../types/phygital';

export const QUEST_XP_RULES: Record<QuestDefinition['questType'], number> = {
  simple: 10,
  discovery: 20,
  speaking: 25,
  family: 30,
  offline: 30,
  habit: 15,
};

export const LEVEL_TITLES: string[] = [
  'Backyard Scout',
  'Curious Spark',
  'Wonder Seeker',
  'Story Weaver',
  'Lab Apprentice',
  'Compass Navigator',
  'Sun-Battery Guardian',
  'Real-World Explorer',
  'Adventure Mentor',
  'Grand Phygital Ranger',
];

export function getAgeBandLabel(ageGroup: AgeGroup): AgeBandLabel {
  switch (ageGroup) {
    case '6-8':
      return 'Junior Explorers';
    case '9-11':
      return 'Curious Discoverers';
    case '12-14':
      return 'Young Trailblazers';
  }
}

export function calculateLevelFromXp(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));
  return Math.floor(safeXp / 100) + 1;
}

export function getLevelProgress(totalXp: number): {
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelThreshold: number;
  percent: number;
} {
  const level = calculateLevelFromXp(totalXp);
  const currentLevelXp = Math.max(0, totalXp) % 100;
  const nextLevelThreshold = 100;
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return {
    level,
    levelTitle: LEVEL_TITLES[titleIndex],
    currentLevelXp,
    nextLevelThreshold,
    percent: Math.min(100, Math.round((currentLevelXp / nextLevelThreshold) * 100)),
  };
}

export function getAuthoritativeQuestXp(
  questType: QuestDefinition['questType'],
  parentAssignedXp?: number
): number {
  if (typeof parentAssignedXp === 'number') {
    return Math.min(30, Math.max(10, Math.round(parentAssignedXp)));
  }
  return QUEST_XP_RULES[questType];
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'badge-nature-detective',
    badgeCode: 'NATURE_DETECTIVE',
    badgeName: 'Nature Detective',
    description: 'Completed real-world outdoor or natural object observations.',
    zoneHint: "World Explorer's Compass",
    accentColor: '#A5B49A',
  },
  {
    id: 'badge-mini-scientist',
    badgeCode: 'MINI_SCIENTIST',
    badgeName: 'Mini Scientist',
    description: 'Conducted a safe hands-on discovery in the Potion & Gadget Lab.',
    zoneHint: 'Potion & Gadget Lab',
    accentColor: '#C77B5A',
  },
  {
    id: 'badge-story-keeper',
    badgeCode: 'STORY_KEEPER',
    badgeName: 'Story Keeper',
    description: 'Preserved an intergenerational family story in English.',
    zoneHint: "Time-Traveler's Attic",
    accentColor: '#E8C878',
  },
  {
    id: 'badge-word-wizard',
    badgeCode: 'WORD_WIZARD',
    badgeName: 'Word Wizard',
    description: 'Practiced English storytelling, reading, or vocabulary.',
    zoneHint: "Word-Weaver's Treehouse",
    accentColor: '#C77B5A',
  },
  {
    id: 'badge-family-explorer',
    badgeCode: 'FAMILY_EXPLORER',
    badgeName: 'Family Explorer',
    description: 'Interviewed a parent, grandparent, or elder about heritage.',
    zoneHint: 'Voice Capsules',
    accentColor: '#E8C878',
  },
  {
    id: 'badge-everyday-hero',
    badgeCode: 'EVERYDAY_HERO',
    badgeName: 'Everyday Hero',
    description: 'Completed real-world helpful habits and tidy-up quests.',
    zoneHint: 'Daily Hero Training',
    accentColor: '#A5B49A',
  },
  {
    id: 'badge-screen-free-champion',
    badgeCode: 'SCREEN_FREE_CHAMPION',
    badgeName: 'Screen-Free Champion',
    description: 'Powered up the Offline Sun-Battery away from the screen.',
    zoneHint: 'Offline Sun-Battery',
    accentColor: '#E8C878',
  },
  {
    id: 'badge-curious-mind',
    badgeCode: 'CURIOUS_MIND',
    badgeName: 'Curious Mind',
    description: 'Taught Leo and Maya a concept through Reverse Tutoring.',
    zoneHint: 'Reverse Tutoring',
    accentColor: '#C77B5A',
  },
  {
    id: 'badge-creative-storyteller',
    badgeCode: 'CREATIVE_STORYTELLER',
    badgeName: 'Creative Storyteller',
    description: 'Wrote or told an original adventure story in English.',
    zoneHint: "Word-Weaver's Treehouse",
    accentColor: '#E8C878',
  },
  {
    id: 'badge-discovery-master',
    badgeCode: 'DISCOVERY_MASTER',
    badgeName: 'Discovery Master',
    description: 'Earned 250 XP or completed 5 real-world adventures!',
    zoneHint: 'All Adventure Zones',
    accentColor: '#A5B49A',
  },
];

export function evaluateNewBadges(params: {
  childId: string;
  totalXp: number;
  progress: QuestProgressRecord[];
  existingBadges: ChildBadge[];
  completedOfflineCount: number;
  memoryCardCount: number;
  reverseTutoringCount: number;
  soundScavengerCount: number;
}): ChildBadge[] {
  const owned = new Set(params.existingBadges.map((b) => b.badgeCode));
  const newlyUnlocked: ChildBadge[] = [];
  const now = new Date().toISOString();

  const tryUnlock = (badgeCode: string) => {
    if (owned.has(badgeCode)) return;
    const def = BADGE_CATALOG.find((b) => b.badgeCode === badgeCode);
    if (!def) return;
    owned.add(badgeCode);
    newlyUnlocked.push({
      childId: params.childId,
      badgeId: def.id,
      badgeCode: def.badgeCode,
      badgeName: def.badgeName,
      unlockedAt: now,
    });
  };

  const zonesCompleted = new Set(params.progress.map((p) => p.questZone));

  if (zonesCompleted.has('potion-gadget-lab')) tryUnlock('MINI_SCIENTIST');
  if (zonesCompleted.has('world-explorers-compass') || params.soundScavengerCount > 0) {
    tryUnlock('NATURE_DETECTIVE');
  }
  if (zonesCompleted.has('time-travelers-attic') || params.memoryCardCount > 0) {
    tryUnlock('STORY_KEEPER');
  }
  if (params.memoryCardCount > 0) {
    tryUnlock('FAMILY_EXPLORER');
  }
  if (zonesCompleted.has('word-weavers-treehouse')) {
    tryUnlock('WORD_WIZARD');
    tryUnlock('CREATIVE_STORYTELLER');
  }
  if (zonesCompleted.has('daily-hero-training')) {
    tryUnlock('EVERYDAY_HERO');
  }
  if (params.completedOfflineCount > 0) {
    tryUnlock('SCREEN_FREE_CHAMPION');
  }
  if (params.reverseTutoringCount > 0) {
    tryUnlock('CURIOUS_MIND');
  }
  if (params.totalXp >= 250 || params.progress.length >= 5) {
    tryUnlock('DISCOVERY_MASTER');
  }

  return newlyUnlocked;
}
