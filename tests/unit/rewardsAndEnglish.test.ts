import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertEnglishOnlyText, buildCompanionSystemPrompt } from '../../src/utils/englishGuard';
import {
  BADGE_CATALOG,
  calculateLevelFromXp,
  evaluateNewBadges,
  getAuthoritativeQuestXp,
  getLevelProgress,
} from '../../src/utils/rewards';
import { companionDialogueSchema, objectScanResultSchema } from '../../src/utils/schemas';

describe('Reward & Level Engine', () => {
  it('enforces authoritative quest XP rules', () => {
    expect(getAuthoritativeQuestXp('simple')).toBe(10);
    expect(getAuthoritativeQuestXp('discovery')).toBe(20);
    expect(getAuthoritativeQuestXp('speaking')).toBe(25);
    expect(getAuthoritativeQuestXp('family')).toBe(30);
    expect(getAuthoritativeQuestXp('offline')).toBe(30);
    expect(getAuthoritativeQuestXp('habit', 18)).toBe(18);
    expect(getAuthoritativeQuestXp('habit', 999)).toBe(30); // clamped
  });

  it('computes progressive levels accurately', () => {
    expect(calculateLevelFromXp(0)).toBe(1);
    expect(calculateLevelFromXp(99)).toBe(1);
    expect(calculateLevelFromXp(100)).toBe(2);
    expect(calculateLevelFromXp(245)).toBe(3);
    expect(getLevelProgress(245).currentLevelXp).toBe(45);
  });

  it('unlocks appropriate badges without duplicating existing ones', () => {
    expect(BADGE_CATALOG).toHaveLength(10);
    const unlocked = evaluateNewBadges({
      childId: 'c1',
      totalXp: 260,
      progress: [
        {
          id: 'p1',
          childId: 'c1',
          questZone: 'potion-gadget-lab',
          questTitle: 'Salt Mystery',
          status: 'completed',
          aiEvaluationSummary: 'Great observation',
          xpAwarded: 20,
          completedAt: new Date().toISOString(),
        },
      ],
      existingBadges: [],
      completedOfflineCount: 1,
      memoryCardCount: 1,
      reverseTutoringCount: 1,
      soundScavengerCount: 1,
    });

    const codes = unlocked.map((b) => b.badgeCode);
    expect(codes).toContain('MINI_SCIENTIST');
    expect(codes).toContain('SCREEN_FREE_CHAMPION');
    expect(codes).toContain('CURIOUS_MIND');
    expect(codes).toContain('DISCOVERY_MASTER');
  });
});

describe('AI Schema & Strict English-Only Audit', () => {
  it('validates companion dialogue and object scan schemas', () => {
    const validDialogue = {
      active_speaker: 'both',
      dialogue_turns: [
        { character: 'leo', emotion: 'amazed', text: 'Fascinating discovery!' },
        { character: 'maya', emotion: 'curious', text: 'What happens next?' },
      ],
      quest_completed: true,
      xp_awarded: 20,
      next_action: 'observe',
      animation: 'celebration',
    };
    expect(companionDialogueSchema.parse(validDialogue).active_speaker).toBe('both');

    const validScan = {
      detectedObjects: ['salt', 'water'],
      isMessyDesk: false,
      safetyCleared: true,
      questTitle: 'Salt Solution Lab',
      questPrompt: 'Stir a pinch of salt into water with an adult.',
      experimentSteps: ['Stir gently', 'Observe'],
      requiresAdultAssistance: true,
      dialogue: validDialogue,
    };
    expect(objectScanResultSchema.parse(validScan).questTitle).toBe('Salt Solution Lab');
  });

  it('embeds explicit English-only directive in AI system prompts', () => {
    const prompt = buildCompanionSystemPrompt('9-11');
    expect(prompt).toContain('exclusively in natural, age-appropriate English');
    expect(prompt).toContain('Never generate Bengali, Hindi');
  });

  it('audits all source and supabase files to confirm zero non-English scripts', () => {
    const walk = (dir: string): string[] => {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...walk(full));
        } else if (/\.(ts|tsx|sql)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    };

    const srcFiles = [
      ...walk(path.resolve(__dirname, '../../src')),
      ...walk(path.resolve(__dirname, '../../supabase')),
    ];
    expect(srcFiles.length).toBeGreaterThan(10);

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(assertEnglishOnlyText(content), `Non-English script found in ${file}`).toBe(true);
    }
  });
});
