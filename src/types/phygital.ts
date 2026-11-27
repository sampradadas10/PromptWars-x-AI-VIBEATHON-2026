export type AgeGroup = '6-8' | '9-11' | '12-14';

export type AgeBandLabel =
  | 'Junior Explorers'
  | 'Curious Discoverers'
  | 'Young Trailblazers';

export type ZoneId =
  | 'potion-gadget-lab'
  | 'world-explorers-compass'
  | 'time-travelers-attic'
  | 'word-weavers-treehouse'
  | 'daily-hero-training';

export type CompanionId = 'leo' | 'maya';

export type CompanionEmotion =
  | 'curious'
  | 'amazed'
  | 'happy'
  | 'thinking'
  | 'encouraging'
  | 'surprised';

export type CompanionAnimation =
  | 'idle'
  | 'walking'
  | 'talking'
  | 'happy'
  | 'thinking'
  | 'surprised'
  | 'celebration'
  | 'quest';

export type DialogueTrigger =
  | 'reverse_tutoring'
  | 'object_scan'
  | 'voice_capsule'
  | 'sound_scavenger'
  | 'offline_battery_return'
  | 'habit_completed'
  | 'general_greeting';

export interface DialogueTurn {
  character: CompanionId;
  emotion: CompanionEmotion;
  text: string;
}

export interface CompanionDialogueResponse {
  active_speaker: 'leo' | 'maya' | 'both';
  dialogue_turns: DialogueTurn[];
  quest_completed: boolean;
  xp_awarded: number;
  next_action: string;
  animation: CompanionAnimation;
}

export interface ParentAccount {
  id: string;
  email: string;
  displayName: string;
  pinHash: string;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  nickname: string;
  ageGroup: AgeGroup;
  totalXp: number;
  level: number;
  sunBatteryLevel: number;
  createdAt: string;
}

export interface ParentalControls {
  childId: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  aiEnabled: boolean;
  voiceCapsulesEnabled: boolean;
  arHabitMirrorEnabled: boolean;
  consentAcceptedAt: string | null;
}

export interface QuestDefinition {
  id: string;
  zoneId: ZoneId;
  title: string;
  subtitle: string;
  promptByAge: Record<AgeGroup, string>;
  stepsByAge: Record<AgeGroup, string[]>;
  safetyNote: string;
  requiresAdultAssistance: boolean;
  questType: 'simple' | 'discovery' | 'speaking' | 'family' | 'offline' | 'habit';
  estimatedMinutes: number;
  badgeHint?: string;
}

export interface QuestProgressRecord {
  id: string;
  childId: string;
  questZone: ZoneId | 'signature-feature';
  questTitle: string;
  status: 'completed' | 'in_progress';
  aiEvaluationSummary: string;
  xpAwarded: number;
  completedAt: string;
}

export interface ParentQuest {
  id: string;
  childId: string;
  title: string;
  description: string;
  rewardXp: number;
  dueAt: string | null;
  status: 'assigned' | 'completed';
  ageGroup: AgeGroup;
  createdAt: string;
}

export interface BadgeDefinition {
  id: string;
  badgeCode: string;
  badgeName: string;
  description: string;
  zoneHint: string;
  accentColor: string;
}

export interface ChildBadge {
  childId: string;
  badgeId: string;
  badgeCode: string;
  badgeName: string;
  unlockedAt: string;
}

export type EphemeralMediaType = 'image' | 'audio' | 'before_after';

export interface EphemeralMediaRecord {
  id: string;
  childId: string;
  questId: string | null;
  mediaType: EphemeralMediaType;
  storageBucketPath: string;
  createdAt: string;
  expiresAt: string;
  deletedAt: string | null;
  deletionStatus: 'active' | 'expired_pending_purge' | 'purged';
  previewDataUrl?: string;
}

export interface ObjectScanResult {
  detectedObjects: string[];
  isMessyDesk: boolean;
  safetyCleared: boolean;
  questTitle: string;
  questPrompt: string;
  experimentSteps: string[];
  requiresAdultAssistance: boolean;
  dialogue: CompanionDialogueResponse;
}

export interface ReverseTutoringTopic {
  id: string;
  title: string;
  leoQuestion: string;
  mayaFollowUp: string;
  keyConcepts: string[];
  ageGroup: AgeGroup;
}

export interface ReverseTutoringEvaluation {
  conceptualUnderstanding: number; // 1-5
  accuracy: number; // 1-5
  clarity: number; // 1-5
  usedExamples: boolean;
  strengths: string;
  followUpQuestion: string;
  dialogue: CompanionDialogueResponse;
}

export interface MemoryCard {
  id: string;
  childId: string;
  promptTitle: string;
  familyMemberRole: string;
  transcript: string;
  storySummary: string;
  memoryCardDescription: string;
  followUpQuestion: string;
  adultConsentConfirmed: boolean;
  createdAt: string;
  mediaId?: string;
}

export interface OfflineMissionSession {
  id: string;
  childId: string;
  missionId: string;
  missionTitle: string;
  durationMinutes: 15 | 20 | 30;
  startedAt: string;
  targetCompletedAt: string;
  completedAt: string | null;
  status: 'active' | 'ready_to_claim' | 'completed' | 'cancelled';
}

export interface EcosystemState {
  sprouts: number;
  butterflies: number;
  flowers: number;
  tidyScore: number;
}
