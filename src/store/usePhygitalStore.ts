import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AgeGroup,
  ChildBadge,
  ChildProfile,
  CompanionAnimation,
  DialogueTurn,
  EcosystemState,
  EphemeralMediaRecord,
  EphemeralMediaType,
  MemoryCard,
  OfflineMissionSession,
  ParentalControls,
  ParentAccount,
  ParentQuest,
  QuestDefinition,
  QuestProgressRecord,
} from '../types/phygital';
import {
  calculateLevelFromXp,
  evaluateNewBadges,
  getAuthoritativeQuestXp,
} from '../utils/rewards';
import {
  createEphemeralMediaRecord,
  invokeCloudMediaPurge,
  purgeExpiredMediaLocal,
  type EphemeralPurgeResult,
} from '../services/ephemeralVault';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

export function hashPin(pin: string): string {
  // Simple deterministic client-side PIN digest for Parent Gate verification
  let hash = 2166136261;
  for (let i = 0; i < pin.length; i++) {
    hash ^= pin.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pin_${(hash >>> 0).toString(16)}`;
}

export interface PhygitalState {
  onboardingCompleted: boolean;
  parentAccount: ParentAccount | null;
  parentUnlocked: boolean;
  children: ChildProfile[];
  activeChildId: string | null;
  parentalControlsByChild: Record<string, ParentalControls>;
  questProgress: QuestProgressRecord[];
  parentQuests: ParentQuest[];
  childBadges: ChildBadge[];
  ephemeralMedia: EphemeralMediaRecord[];
  memoryCards: MemoryCard[];
  offlineSessions: OfflineMissionSession[];
  ecosystemByChild: Record<string, EcosystemState>;
  reverseTutoringCountByChild: Record<string, number>;
  soundScavengerCountByChild: Record<string, number>;
  lastPurgeResult: EphemeralPurgeResult | null;

  // UI / Companion live state
  companionAnimation: CompanionAnimation;
  companionDialogue: DialogueTurn[];
  prefer2DCompanions: boolean;

  // Actions
  setPrefer2DCompanions: (prefer: boolean) => void;
  setCompanionState: (animation: CompanionAnimation, dialogue?: DialogueTurn[]) => void;

  registerParent: (input: {
    displayName: string;
    email: string;
    password: string;
    pin: string;
  }) => Promise<void>;
  loginParent: (input: { email: string; password: string }) => Promise<boolean>;
  unlockParentDashboard: (pin: string) => boolean;
  lockParentDashboard: () => void;

  createChildProfile: (input: { nickname: string; ageGroup: AgeGroup }) => Promise<ChildProfile>;
  setActiveChild: (childId: string) => void;
  updateChildAgeGroup: (childId: string, ageGroup: AgeGroup) => void;
  updateParentalControls: (
    childId: string,
    patch: Partial<Omit<ParentalControls, 'childId'>>
  ) => void;
  completeOnboarding: () => void;

  completeQuest: (input: {
    questZone: QuestProgressRecord['questZone'];
    questTitle: string;
    questType: QuestDefinition['questType'];
    aiEvaluationSummary: string;
    parentQuestId?: string;
    featureTag?: 'reverse_tutoring' | 'sound_scavenger' | 'offline';
  }) => Promise<{ xpAwarded: number; newBadges: ChildBadge[] }>;

  assignParentQuest: (input: {
    childId: string;
    title: string;
    description: string;
    rewardXp: number;
    dueAt: string | null;
    ageGroup: AgeGroup;
  }) => void;

  addMemoryCard: (card: Omit<MemoryCard, 'id' | 'createdAt'>) => MemoryCard;

  storeTemporaryMedia: (input: {
    childId: string;
    questId?: string | null;
    mediaType: EphemeralMediaType;
    extension: 'jpg' | 'png' | 'webm';
    previewDataUrl?: string;
    createdAtMs?: number;
  }) => EphemeralMediaRecord;

  expireMediaForTesting: (mediaId: string) => void;
  runPurgeWorker: (nowMs?: number) => Promise<EphemeralPurgeResult>;

  startOfflineMission: (input: {
    childId: string;
    missionId: string;
    missionTitle: string;
    durationMinutes: 15 | 20 | 30;
    startedAtMs?: number;
  }) => OfflineMissionSession;

  completeOfflineMission: (sessionId: string, nowMs?: number) => {
    ok: boolean;
    reason?: string;
    xpAwarded?: number;
  };
  cancelOfflineMission: (sessionId: string) => void;

  growEcosystemHabit: (childId: string, habitName: string) => void;

  deleteChildData: (childId: string) => void;
  resetDemoApp: () => void;
}

const DEFAULT_ECOSYSTEM: EcosystemState = {
  sprouts: 2,
  butterflies: 1,
  flowers: 1,
  tidyScore: 20,
};

const INITIAL_DIALOGUE: DialogueTurn[] = [
  {
    character: 'leo',
    emotion: 'curious',
    text: 'Wait! Let me check my notes—what real-world mystery shall we investigate today?',
  },
  {
    character: 'maya',
    emotion: 'happy',
    text: "Come on! Let's discover something amazing together!",
  },
];

export const usePhygitalStore = create<PhygitalState>()(
  persist(
    (set, get) => ({
      onboardingCompleted: false,
      parentAccount: null,
      parentUnlocked: false,
      children: [],
      activeChildId: null,
      parentalControlsByChild: {},
      questProgress: [],
      parentQuests: [],
      childBadges: [],
      ephemeralMedia: [],
      memoryCards: [],
      offlineSessions: [],
      ecosystemByChild: {},
      reverseTutoringCountByChild: {},
      soundScavengerCountByChild: {},
      lastPurgeResult: null,
      companionAnimation: 'idle',
      companionDialogue: INITIAL_DIALOGUE,
      prefer2DCompanions: false,

      setPrefer2DCompanions: (prefer) => set({ prefer2DCompanions: prefer }),

      setCompanionState: (animation, dialogue) =>
        set((state) => ({
          companionAnimation: animation,
          companionDialogue: dialogue ?? state.companionDialogue,
        })),

      registerParent: async ({ displayName, email, password, pin }) => {
        let parentId: string = crypto.randomUUID();
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
          });
          if (error) throw new Error(error.message);
          if (data.user?.id) parentId = data.user.id;
        }

        const account: ParentAccount = {
          id: parentId,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          pinHash: hashPin(pin),
          createdAt: new Date().toISOString(),
        };

        set({
          parentAccount: account,
          parentUnlocked: true,
        });
      },

      loginParent: async ({ email, password }) => {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return false;
        }
        const existing = get().parentAccount;
        if (!existing) return false;
        if (existing.email === email.trim().toLowerCase()) {
          set({ parentUnlocked: true });
          return true;
        }
        return false;
      },

      unlockParentDashboard: (pin) => {
        const account = get().parentAccount;
        if (!account) return false;
        const ok = account.pinHash === hashPin(pin);
        if (ok) set({ parentUnlocked: true });
        return ok;
      },

      lockParentDashboard: () => set({ parentUnlocked: false }),

      createChildProfile: async ({ nickname, ageGroup }) => {
        const parentId = get().parentAccount?.id ?? 'local-parent';
        const child: ChildProfile = {
          id: crypto.randomUUID(),
          parentId,
          nickname: nickname.trim(),
          ageGroup,
          totalXp: 0,
          level: 1,
          sunBatteryLevel: 40,
          createdAt: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase
            .from('child_profiles')
            .insert({
              parent_id: parentId,
              nickname: child.nickname,
              age_group: child.ageGroup,
            })
            .select()
            .single();
          if (!error && data?.id) {
            child.id = data.id;
          }
        }

        const controls: ParentalControls = {
          childId: child.id,
          cameraEnabled: true,
          microphoneEnabled: true,
          aiEnabled: true,
          voiceCapsulesEnabled: true,
          arHabitMirrorEnabled: true,
          consentAcceptedAt: new Date().toISOString(),
        };

        set((state) => ({
          children: [...state.children, child],
          activeChildId: child.id,
          parentalControlsByChild: {
            ...state.parentalControlsByChild,
            [child.id]: controls,
          },
          ecosystemByChild: {
            ...state.ecosystemByChild,
            [child.id]: { ...DEFAULT_ECOSYSTEM },
          },
        }));

        return child;
      },

      setActiveChild: (childId) => set({ activeChildId: childId }),

      updateChildAgeGroup: (childId, ageGroup) =>
        set((state) => ({
          children: state.children.map((c) => (c.id === childId ? { ...c, ageGroup } : c)),
        })),

      updateParentalControls: (childId, patch) =>
        set((state) => {
          const current = state.parentalControlsByChild[childId] ?? {
            childId,
            cameraEnabled: true,
            microphoneEnabled: true,
            aiEnabled: true,
            voiceCapsulesEnabled: true,
            arHabitMirrorEnabled: true,
            consentAcceptedAt: new Date().toISOString(),
          };
          return {
            parentalControlsByChild: {
              ...state.parentalControlsByChild,
              [childId]: { ...current, ...patch },
            },
          };
        }),

      completeOnboarding: () => set({ onboardingCompleted: true, parentUnlocked: false }),

      completeQuest: async ({
        questZone,
        questTitle,
        questType,
        aiEvaluationSummary,
        parentQuestId,
        featureTag,
      }) => {
        const state = get();
        const child = state.children.find((c) => c.id === state.activeChildId);
        if (!child) return { xpAwarded: 0, newBadges: [] };

        const parentQuest = parentQuestId
          ? state.parentQuests.find((pq) => pq.id === parentQuestId && pq.childId === child.id)
          : undefined;

        const xpAwarded = getAuthoritativeQuestXp(questType, parentQuest?.rewardXp);

        if (isSupabaseConfigured && supabase) {
          await supabase.functions.invoke('complete-quest', {
            body: {
              childId: child.id,
              questZone,
              questTitle,
              questType,
              aiSummary: aiEvaluationSummary,
              parentQuestId: parentQuestId ?? null,
            },
          });
        }

        const record: QuestProgressRecord = {
          id: crypto.randomUUID(),
          childId: child.id,
          questZone,
          questTitle,
          status: 'completed',
          aiEvaluationSummary,
          xpAwarded,
          completedAt: new Date().toISOString(),
        };

        const newTotalXp = child.totalXp + xpAwarded;
        const newLevel = calculateLevelFromXp(newTotalXp);
        const updatedProgress = [record, ...state.questProgress];

        const nextReverseCount =
          (state.reverseTutoringCountByChild[child.id] ?? 0) +
          (featureTag === 'reverse_tutoring' ? 1 : 0);
        const nextSoundCount =
          (state.soundScavengerCountByChild[child.id] ?? 0) +
          (featureTag === 'sound_scavenger' ? 1 : 0);
        const completedOfflineCount =
          state.offlineSessions.filter(
            (s) => s.childId === child.id && s.status === 'completed'
          ).length + (featureTag === 'offline' ? 1 : 0);

        const existingChildBadges = state.childBadges.filter((b) => b.childId === child.id);
        const newBadges = evaluateNewBadges({
          childId: child.id,
          totalXp: newTotalXp,
          progress: updatedProgress.filter((p) => p.childId === child.id),
          existingBadges: existingChildBadges,
          completedOfflineCount,
          memoryCardCount: state.memoryCards.filter((m) => m.childId === child.id).length,
          reverseTutoringCount: nextReverseCount,
          soundScavengerCount: nextSoundCount,
        });

        set((prev) => ({
          children: prev.children.map((c) =>
            c.id === child.id
              ? {
                  ...c,
                  totalXp: newTotalXp,
                  level: newLevel,
                  sunBatteryLevel:
                    questType === 'offline'
                      ? Math.min(100, c.sunBatteryLevel + 25)
                      : c.sunBatteryLevel,
                }
              : c
          ),
          questProgress: updatedProgress,
          parentQuests: parentQuestId
            ? prev.parentQuests.map((pq) =>
                pq.id === parentQuestId ? { ...pq, status: 'completed' } : pq
              )
            : prev.parentQuests,
          childBadges: [...prev.childBadges, ...newBadges],
          reverseTutoringCountByChild: {
            ...prev.reverseTutoringCountByChild,
            [child.id]: nextReverseCount,
          },
          soundScavengerCountByChild: {
            ...prev.soundScavengerCountByChild,
            [child.id]: nextSoundCount,
          },
          companionAnimation: 'celebration',
        }));

        return { xpAwarded, newBadges };
      },

      assignParentQuest: ({ childId, title, description, rewardXp, dueAt, ageGroup }) => {
        const newQuest: ParentQuest = {
          id: crypto.randomUUID(),
          childId,
          title: title.trim(),
          description: description.trim(),
          rewardXp: Math.min(30, Math.max(10, Math.round(rewardXp))),
          dueAt,
          status: 'assigned',
          ageGroup,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          parentQuests: [newQuest, ...state.parentQuests],
        }));
      },

      addMemoryCard: (input) => {
        const card: MemoryCard = {
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          memoryCards: [card, ...state.memoryCards],
        }));
        return card;
      },

      storeTemporaryMedia: ({
        childId,
        questId,
        mediaType,
        extension,
        previewDataUrl,
        createdAtMs,
      }) => {
        const parentId = get().parentAccount?.id ?? 'local-parent';
        const record = createEphemeralMediaRecord({
          parentId,
          childId,
          questId,
          mediaType,
          extension,
          previewDataUrl,
          createdAtMs,
        });
        set((state) => ({
          ephemeralMedia: [record, ...state.ephemeralMedia],
        }));
        return record;
      },

      expireMediaForTesting: (mediaId) => {
        const expiredCreated = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString();
        const expiredAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
        set((state) => ({
          ephemeralMedia: state.ephemeralMedia.map((item) =>
            item.id === mediaId
              ? {
                  ...item,
                  createdAt: expiredCreated,
                  expiresAt: expiredAt,
                  deletionStatus: 'expired_pending_purge',
                }
              : item
          ),
        }));
      },

      runPurgeWorker: async (nowMs = Date.now()) => {
        const cloudResult = await invokeCloudMediaPurge().catch(() => null);
        if (cloudResult) {
          set({ lastPurgeResult: cloudResult });
          return cloudResult;
        }

        const currentRecords = get().ephemeralMedia;
        const { remainingRecords, result } = await purgeExpiredMediaLocal(
          currentRecords,
          async () => ({ ok: true }),
          nowMs
        );

        set({
          ephemeralMedia: remainingRecords,
          lastPurgeResult: result,
        });
        return result;
      },

      startOfflineMission: ({
        childId,
        missionId,
        missionTitle,
        durationMinutes,
        startedAtMs = Date.now(),
      }) => {
        const session: OfflineMissionSession = {
          id: crypto.randomUUID(),
          childId,
          missionId,
          missionTitle,
          durationMinutes,
          startedAt: new Date(startedAtMs).toISOString(),
          targetCompletedAt: new Date(startedAtMs + durationMinutes * 60 * 1000).toISOString(),
          completedAt: null,
          status: 'active',
        };
        set((state) => ({
          offlineSessions: [
            session,
            ...state.offlineSessions.map((s) =>
              s.childId === childId && s.status === 'active'
                ? { ...s, status: 'cancelled' as const }
                : s
            ),
          ],
        }));
        return session;
      },

      completeOfflineMission: (sessionId, nowMs = Date.now()) => {
        const session = get().offlineSessions.find((s) => s.id === sessionId);
        if (!session) return { ok: false, reason: 'Offline mission session not found.' };

        const targetMs = new Date(session.targetCompletedAt).getTime();
        if (nowMs < targetMs) {
          const remainingMin = Math.ceil((targetMs - nowMs) / 60000);
          return {
            ok: false,
            reason: `Keep exploring away from the screen! About ${remainingMin} minute(s) left on your Sun-Battery timer.`,
          };
        }

        const xpAwarded = getAuthoritativeQuestXp('offline');
        set((state) => ({
          offlineSessions: state.offlineSessions.map((s) =>
            s.id === sessionId
              ? { ...s, status: 'completed', completedAt: new Date(nowMs).toISOString() }
              : s
          ),
        }));

        void get().completeQuest({
          questZone: 'daily-hero-training',
          questTitle: `Offline Sun-Battery: ${session.missionTitle}`,
          questType: 'offline',
          aiEvaluationSummary: `Spent ${session.durationMinutes} minutes away from screens on "${session.missionTitle}".`,
          featureTag: 'offline',
        });

        return { ok: true, xpAwarded };
      },

      cancelOfflineMission: (sessionId) =>
        set((state) => ({
          offlineSessions: state.offlineSessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'cancelled' } : s
          ),
        })),

      growEcosystemHabit: (childId) =>
        set((state) => {
          const current = state.ecosystemByChild[childId] ?? { ...DEFAULT_ECOSYSTEM };
          return {
            ecosystemByChild: {
              ...state.ecosystemByChild,
              [childId]: {
                sprouts: current.sprouts + 1,
                flowers: current.flowers + 1,
                butterflies: current.butterflies + (current.flowers % 2 === 0 ? 1 : 0),
                tidyScore: Math.min(100, current.tidyScore + 15),
              },
            },
          };
        }),

      deleteChildData: (childId) =>
        set((state) => {
          const remainingChildren = state.children.filter((c) => c.id !== childId);
          const nextActive =
            state.activeChildId === childId
              ? (remainingChildren[0]?.id ?? null)
              : state.activeChildId;
          const nextControls = { ...state.parentalControlsByChild };
          delete nextControls[childId];
          const nextEco = { ...state.ecosystemByChild };
          delete nextEco[childId];

          return {
            children: remainingChildren,
            activeChildId: nextActive,
            parentalControlsByChild: nextControls,
            ecosystemByChild: nextEco,
            questProgress: state.questProgress.filter((q) => q.childId !== childId),
            parentQuests: state.parentQuests.filter((q) => q.childId !== childId),
            childBadges: state.childBadges.filter((b) => b.childId !== childId),
            ephemeralMedia: state.ephemeralMedia.filter((m) => m.childId !== childId),
            memoryCards: state.memoryCards.filter((m) => m.childId !== childId),
            offlineSessions: state.offlineSessions.filter((s) => s.childId !== childId),
          };
        }),

      resetDemoApp: () =>
        set({
          onboardingCompleted: false,
          parentAccount: null,
          parentUnlocked: false,
          children: [],
          activeChildId: null,
          parentalControlsByChild: {},
          questProgress: [],
          parentQuests: [],
          childBadges: [],
          ephemeralMedia: [],
          memoryCards: [],
          offlineSessions: [],
          ecosystemByChild: {},
          reverseTutoringCountByChild: {},
          soundScavengerCountByChild: {},
          lastPurgeResult: null,
          companionAnimation: 'idle',
          companionDialogue: INITIAL_DIALOGUE,
        }),
    }),
    {
      name: 'phygital-adventure-store-v1',
    }
  )
);
