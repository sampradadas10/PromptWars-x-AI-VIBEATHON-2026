import { beforeEach, describe, expect, it } from 'vitest';
import { usePhygitalStore } from '../../src/store/usePhygitalStore';

describe('PHYGITAL End-to-End Store Integration Flows', () => {
  beforeEach(() => {
    usePhygitalStore.getState().resetDemoApp();
  });

  it('registers parent, creates child profile, enforces PIN lock, and persists XP & parent quests', async () => {
    const store = usePhygitalStore.getState();

    await store.registerParent({
      displayName: 'Jordan',
      email: 'jordan@example.com',
      password: 'password123',
      pin: '4321',
    });

    const child = await store.createChildProfile({ nickname: 'Scout', ageGroup: '9-11' });
    expect(child.nickname).toBe('Scout');

    store.completeOnboarding();
    expect(usePhygitalStore.getState().parentUnlocked).toBe(false);

    // Wrong PIN fails; right PIN unlocks
    expect(usePhygitalStore.getState().unlockParentDashboard('0000')).toBe(false);
    expect(usePhygitalStore.getState().unlockParentDashboard('4321')).toBe(true);

    // Parent assigns quest
    usePhygitalStore.getState().assignParentQuest({
      childId: child.id,
      title: 'Read for 20 minutes',
      description: 'Read a chapter book in English.',
      rewardXp: 20,
      dueAt: null,
      ageGroup: '9-11',
    });

    const assignedId = usePhygitalStore.getState().parentQuests[0].id;

    // Child completes assigned quest
    const reward = await usePhygitalStore.getState().completeQuest({
      questZone: 'daily-hero-training',
      questTitle: 'Read for 20 minutes',
      questType: 'habit',
      aiEvaluationSummary: 'Read quietly for 20 minutes.',
      parentQuestId: assignedId,
    });

    expect(reward.xpAwarded).toBe(20);
    expect(usePhygitalStore.getState().children[0].totalXp).toBe(20);
    expect(usePhygitalStore.getState().parentQuests[0].status).toBe('completed');
  });

  it('validates Offline Sun-Battery elapsed timestamps and blocks early completion', () => {
    const store = usePhygitalStore.getState();
    const childId = 'child-offline-test';

    usePhygitalStore.setState({
      children: [
        {
          id: childId,
          parentId: 'p1',
          nickname: 'Sunny',
          ageGroup: '6-8',
          totalXp: 0,
          level: 1,
          sunBatteryLevel: 40,
          createdAt: new Date().toISOString(),
        },
      ],
      activeChildId: childId,
    });

    const startMs = Date.UTC(2026, 10, 25, 10, 0, 0);
    const session = store.startOfflineMission({
      childId,
      missionId: 'off-read-book',
      missionTitle: 'Paper-Book Reading Quest',
      durationMinutes: 15,
      startedAtMs: startMs,
    });

    // Attempting completion after 5 minutes fails
    const early = usePhygitalStore
      .getState()
      .completeOfflineMission(session.id, startMs + 5 * 60 * 1000);
    expect(early.ok).toBe(false);

    // Completing after 15 minutes succeeds and charges Sun-Battery
    const ready = usePhygitalStore
      .getState()
      .completeOfflineMission(session.id, startMs + 15 * 60 * 1000);
    expect(ready.ok).toBe(true);
    expect(ready.xpAwarded).toBe(30);
    expect(usePhygitalStore.getState().children[0].sunBatteryLevel).toBe(65);
  });

  it('purges expired temporary media and supports full child data deletion', async () => {
    const store = usePhygitalStore.getState();
    const child = await store.createChildProfile({ nickname: 'MayaFan', ageGroup: '12-14' });

    const media = usePhygitalStore.getState().storeTemporaryMedia({
      childId: child.id,
      mediaType: 'audio',
      extension: 'webm',
    });

    usePhygitalStore.getState().expireMediaForTesting(media.id);
    const purgeResult = await usePhygitalStore.getState().runPurgeWorker(Date.now());
    expect(purgeResult.expiredFound).toBe(1);
    expect(purgeResult.storageDeleted).toBe(1);
    expect(usePhygitalStore.getState().ephemeralMedia).toHaveLength(0);

    // Delete child data removes profile and related state
    usePhygitalStore.getState().deleteChildData(child.id);
    expect(usePhygitalStore.getState().children).toHaveLength(0);
  });
});
