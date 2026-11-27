import { z } from 'zod';

export const ageGroupSchema = z.enum(['6-8', '9-11', '12-14']);

export const companionEmotionSchema = z.enum([
  'curious',
  'amazed',
  'happy',
  'thinking',
  'encouraging',
  'surprised',
]);

export const companionAnimationSchema = z.enum([
  'idle',
  'walking',
  'talking',
  'happy',
  'thinking',
  'surprised',
  'celebration',
  'quest',
]);

export const dialogueTurnSchema = z.object({
  character: z.enum(['leo', 'maya']),
  emotion: companionEmotionSchema,
  text: z.string().min(1).max(600),
});

export const companionDialogueSchema = z.object({
  active_speaker: z.enum(['leo', 'maya', 'both']),
  dialogue_turns: z.array(dialogueTurnSchema).min(1).max(4),
  quest_completed: z.boolean(),
  xp_awarded: z.number().int().min(0).max(50),
  next_action: z.string().min(1).max(160),
  animation: companionAnimationSchema,
});

export const objectScanResultSchema = z.object({
  detectedObjects: z.array(z.string().min(1)).min(1),
  isMessyDesk: z.boolean(),
  safetyCleared: z.boolean(),
  questTitle: z.string().min(3).max(120),
  questPrompt: z.string().min(10).max(500),
  experimentSteps: z.array(z.string().min(3)).min(1).max(6),
  requiresAdultAssistance: z.boolean(),
  dialogue: companionDialogueSchema,
});

export const childProfileInputSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'Please enter a nickname with at least 2 characters.')
    .max(24, 'Nickname must be 24 characters or fewer.')
    .regex(/^[A-Za-z0-9 _-]+$/, 'Use English letters, numbers, spaces, or hyphens only.'),
  ageGroup: ageGroupSchema,
});

export const parentQuestInputSchema = z.object({
  title: z.string().trim().min(3, 'Quest title must be at least 3 characters.').max(80),
  description: z
    .string()
    .trim()
    .min(5, 'Please provide clear English instructions for this quest.')
    .max(300),
  rewardXp: z.number().int().min(10).max(30),
  dueAt: z.string().nullable(),
  ageGroup: ageGroupSchema,
});

export const parentRegisterSchema = z.object({
  displayName: z.string().trim().min(2, 'Please enter your name.').max(50),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  pin: z.string().regex(/^\d{4}$/, 'Parent PIN must be exactly 4 digits.'),
});
