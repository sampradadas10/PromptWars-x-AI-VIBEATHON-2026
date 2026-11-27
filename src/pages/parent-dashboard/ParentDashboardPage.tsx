import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Clock,
  Lock,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Trash2,
  Unlock,
  UserPlus,
} from 'lucide-react';
import { StorybookCard } from '../../components/common/StorybookUI';
import { ADVENTURE_ZONES } from '../../data/quests';
import { getMediaRemainingTime } from '../../services/ephemeralVault';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import type { AgeGroup } from '../../types/phygital';
import { childProfileInputSchema, parentQuestInputSchema } from '../../utils/schemas';

export function ParentDashboardPage() {
  const navigate = useNavigate();
  const parentAccount = usePhygitalStore((s) => s.parentAccount);
  const parentUnlocked = usePhygitalStore((s) => s.parentUnlocked);
  const unlockParentDashboard = usePhygitalStore((s) => s.unlockParentDashboard);
  const lockParentDashboard = usePhygitalStore((s) => s.lockParentDashboard);
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const setActiveChild = usePhygitalStore((s) => s.setActiveChild);
  const createChildProfile = usePhygitalStore((s) => s.createChildProfile);
  const updateChildAgeGroup = usePhygitalStore((s) => s.updateChildAgeGroup);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const updateParentalControls = usePhygitalStore((s) => s.updateParentalControls);
  const questProgress = usePhygitalStore((s) => s.questProgress);
  const parentQuests = usePhygitalStore((s) => s.parentQuests);
  const assignParentQuest = usePhygitalStore((s) => s.assignParentQuest);
  const childBadges = usePhygitalStore((s) => s.childBadges);
  const ephemeralMedia = usePhygitalStore((s) => s.ephemeralMedia);
  const expireMediaForTesting = usePhygitalStore((s) => s.expireMediaForTesting);
  const runPurgeWorker = usePhygitalStore((s) => s.runPurgeWorker);
  const lastPurgeResult = usePhygitalStore((s) => s.lastPurgeResult);
  const offlineSessions = usePhygitalStore((s) => s.offlineSessions);
  const deleteChildData = usePhygitalStore((s) => s.deleteChildData);
  const resetDemoApp = usePhygitalStore((s) => s.resetDemoApp);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Custom quest form
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questXp, setQuestXp] = useState(15);
  const [questDue, setQuestDue] = useState('');
  const [questFormMsg, setQuestFormMsg] = useState<string | null>(null);

  // Add child form
  const [newNickname, setNewNickname] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState<AgeGroup>('9-11');
  const [childFormMsg, setChildFormMsg] = useState<string | null>(null);

  const [purging, setPurging] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];

  if (!parentUnlocked) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      setPinError(null);
      if (!unlockParentDashboard(pinInput)) {
        setPinError('Incorrect 4-digit Parent PIN. (Demo default is 1234 if Quick Started.)');
        return;
      }
      setPinInput('');
    };

    return (
      <div className="max-w-md mx-auto py-8">
        <StorybookCard className="bg-white space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-espresso">Parent Co-Pilot Gate</h1>
            <p className="text-sm text-cocoa">
              Enter your 4-digit Parent PIN for{' '}
              <strong>{parentAccount?.displayName ?? 'Parent'}</strong> to view progress, assign
              real-life tasks, and inspect the 48-Hour Privacy Shield.
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit PIN"
              aria-label="4-digit Parent PIN"
              className="w-full text-center tracking-[0.5em] text-xl font-extrabold rounded-xl border border-espresso/20 bg-parchment px-4 py-3 text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
            {pinError && (
              <p className="text-xs font-semibold text-terracotta" role="alert">
                {pinError}
              </p>
            )}
            <button
              type="submit"
              className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta"
            >
              <Unlock className="h-4 w-4" />
              Unlock Parent Dashboard
            </button>
          </form>
        </StorybookCard>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <StorybookCard className="bg-white text-center space-y-4 py-10">
        <p className="font-bold text-espresso">No child profiles found.</p>
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="tactile-btn bg-terracotta text-white px-5 py-2.5 text-sm"
        >
          Open Onboarding Setup
        </button>
      </StorybookCard>
    );
  }

  const controls = controlsByChild[activeChild.id] ?? {
    childId: activeChild.id,
    cameraEnabled: true,
    microphoneEnabled: true,
    aiEnabled: true,
    voiceCapsulesEnabled: true,
    arHabitMirrorEnabled: true,
    consentAcceptedAt: null,
  };

  const myProgress = questProgress.filter((q) => q.childId === activeChild.id);
  const myBadges = childBadges.filter((b) => b.childId === activeChild.id);
  const myMedia = ephemeralMedia.filter((m) => m.childId === activeChild.id);
  const myOfflineMinutes = offlineSessions
    .filter((s) => s.childId === activeChild.id && s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const zoneCounts = ADVENTURE_ZONES.map((z) => ({
    name: z.name.split(' ')[0],
    fullName: z.name,
    count: myProgress.filter((p) => p.questZone === z.id).length,
  }));
  const maxZoneCount = Math.max(1, ...zoneCounts.map((z) => z.count));

  const handleAssignQuest = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestFormMsg(null);
    const parsed = parentQuestInputSchema.safeParse({
      title: questTitle,
      description: questDesc,
      rewardXp: questXp,
      dueAt: questDue || null,
      ageGroup: activeChild.ageGroup,
    });
    if (!parsed.success) {
      setQuestFormMsg(parsed.error.issues[0]?.message ?? 'Please check quest fields.');
      return;
    }
    assignParentQuest({
      childId: activeChild.id,
      ...parsed.data,
    });
    setQuestTitle('');
    setQuestDesc('');
    setQuestDue('');
    setQuestFormMsg(`Assigned "${parsed.data.title}" to ${activeChild.nickname}!`);
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildFormMsg(null);
    const parsed = childProfileInputSchema.safeParse({
      nickname: newNickname,
      ageGroup: newAgeGroup,
    });
    if (!parsed.success) {
      setChildFormMsg(parsed.error.issues[0]?.message ?? 'Invalid nickname.');
      return;
    }
    await createChildProfile(parsed.data);
    setNewNickname('');
    setChildFormMsg(`Created profile for ${parsed.data.nickname}!`);
  };

  const handleRunPurge = async () => {
    setPurging(true);
    try {
      await runPurgeWorker(Date.now());
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-bold text-terracotta">
            <ShieldCheck className="h-3.5 w-3.5" />
            Parent Co-Pilot Dashboard
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-espresso">
            Supervising {activeChild.nickname}
          </h1>
          <p className="text-xs text-cocoa">
            Signed in as {parentAccount?.displayName} ({parentAccount?.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeChild.id}
            onChange={(e) => setActiveChild(e.target.value)}
            aria-label="Select Child Profile"
            className="rounded-xl border border-espresso/15 bg-white px-3 py-2 text-xs font-bold text-espresso"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} (Ages {c.ageGroup})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={lockParentDashboard}
            className="tactile-btn bg-espresso text-white px-4 py-2 text-xs"
          >
            <Lock className="h-3.5 w-3.5" />
            Lock Parent View
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StorybookCard className="bg-white !p-4">
          <p className="text-xs font-bold text-cocoa">Current Level &amp; XP</p>
          <p className="mt-1 text-2xl font-extrabold text-espresso">
            Lv.{activeChild.level} · {activeChild.totalXp} XP
          </p>
        </StorybookCard>
        <StorybookCard className="bg-white !p-4">
          <p className="text-xs font-bold text-cocoa">Quests Completed</p>
          <p className="mt-1 text-2xl font-extrabold text-terracotta">{myProgress.length}</p>
        </StorybookCard>
        <StorybookCard className="bg-white !p-4">
          <p className="text-xs font-bold text-cocoa">Screen-Free Offline Time</p>
          <p className="mt-1 text-2xl font-extrabold text-[#556B47]">{myOfflineMinutes} min</p>
        </StorybookCard>
        <StorybookCard className="bg-white !p-4">
          <p className="text-xs font-bold text-cocoa">Badges Unlocked</p>
          <p className="mt-1 text-2xl font-extrabold text-[#B47D18]">{myBadges.length}</p>
        </StorybookCard>
      </div>

      {/* 48-HOUR PRIVACY SHIELD */}
      <StorybookCard className="bg-white border-2 border-sage/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/30 text-espresso">
              <ShieldCheck className="h-6 w-6 text-[#556B47]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-espresso">48-HOUR PRIVACY SHIELD</h2>
              <p className="text-xs font-semibold text-[#556B47]">
                Your child&apos;s temporary media is automatically deleted after 48 hours.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRunPurge}
            disabled={purging}
            className="tactile-btn bg-sage text-espresso px-4 py-2 text-xs shadow-tactile-sage"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${purging ? 'animate-spin' : ''}`} />
            Run Cleanup Worker Now
          </button>
        </div>

        <p className="text-xs text-cocoa leading-relaxed">
          Voice capsules and camera snapshots live strictly in the private temporary vault (never
          permanent progress logs, never used for AI model training). Access cuts off immediately at
          48 hours and our scheduled cleanup worker removes both files and metadata every 5 minutes.
        </p>

        {lastPurgeResult && (
          <div className="rounded-xl bg-parchment border border-espresso/10 px-3.5 py-2 text-xs text-espresso">
            Last worker run ({lastPurgeResult.mode}): checked{' '}
            <strong>{lastPurgeResult.expiredFound}</strong> expired item(s), physically deleted{' '}
            <strong>{lastPurgeResult.storageDeleted}</strong> object(s), removed{' '}
            <strong>{lastPurgeResult.metadataDeleted}</strong> metadata row(s), failed{' '}
            <strong>{lastPurgeResult.failed}</strong>.
          </div>
        )}

        {myMedia.length > 0 ? (
          <>
            {/* Mobile Cards */}
            <div className="space-y-2.5 md:hidden">
              {myMedia.map((item) => {
                const rem = getMediaRemainingTime(item.expiresAt, nowMs);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-parchment border border-espresso/10 p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-espresso capitalize">
                        {item.mediaType.replace('_', ' ')}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                          rem.isExpired
                            ? 'bg-terracotta/15 text-terracotta'
                            : 'bg-sage/25 text-espresso'
                        }`}
                      >
                        {rem.isExpired ? 'Expired (Denied)' : 'Active Temporary'}
                      </span>
                    </div>
                    <p className="text-cocoa">
                      Uploaded: {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-semibold text-espresso">
                        {rem.formattedRemaining}
                      </span>
                      {!rem.isExpired && (
                        <button
                          type="button"
                          onClick={() => expireMediaForTesting(item.id)}
                          className="font-bold text-terracotta hover:underline"
                        >
                          Simulate 48h Expiry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-espresso/10 text-cocoa">
                    <th className="py-2 pr-3">Media Type</th>
                    <th className="py-2 pr-3">Uploaded</th>
                    <th className="py-2 pr-3">48h Countdown</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Test Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/10">
                  {myMedia.map((item) => {
                    const rem = getMediaRemainingTime(item.expiresAt, nowMs);
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-3 font-bold text-espresso capitalize">
                          {item.mediaType.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 pr-3 text-cocoa">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-espresso">
                          {rem.formattedRemaining}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                              rem.isExpired
                                ? 'bg-terracotta/15 text-terracotta'
                                : 'bg-sage/25 text-espresso'
                            }`}
                          >
                            {rem.isExpired ? 'Expired (Access Denied)' : 'Active Temporary'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {!rem.isExpired && (
                            <button
                              type="button"
                              onClick={() => expireMediaForTesting(item.id)}
                              className="text-[11px] font-bold text-terracotta hover:underline whitespace-nowrap"
                            >
                              Simulate 48h Expiry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-parchment px-4 py-3 text-xs text-cocoa flex items-center gap-2">
            <Clock className="h-4 w-4 text-terracotta" />
            Temporary media count: <strong>0</strong>. No raw images or audio recordings are stored
            right now.
          </div>
        )}
      </StorybookCard>

      {/* Progress Chart + Custom Quest Assignment */}
      <div className="grid lg:grid-cols-12 gap-5">
        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-extrabold text-espresso">
              Adventure Zone Activity &amp; Learning Summaries
            </h2>
          </div>

          <div className="space-y-2.5">
            {zoneCounts.map((z) => (
              <div key={z.fullName} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-espresso">
                  <span>{z.fullName}</span>
                  <span>{z.count} completed</span>
                </div>
                <div className="h-3 rounded-full bg-sandcard overflow-hidden">
                  <div
                    className="h-full rounded-full bg-terracotta transition-all duration-500"
                    style={{ width: `${Math.round((z.count / maxZoneCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-espresso/10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa">
              Recent Anonymized Learning History
            </p>
            {myProgress.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myProgress.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl bg-parchment p-2.5 text-xs border border-espresso/10"
                  >
                    <div className="flex justify-between font-bold text-espresso">
                      <span>{p.questTitle}</span>
                      <span className="text-terracotta">+{p.xpAwarded} XP</span>
                    </div>
                    <p className="text-cocoa mt-0.5">{p.aiEvaluationSummary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-cocoa">No completed quests recorded yet.</p>
            )}
          </div>
        </StorybookCard>

        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-extrabold text-espresso">
              Assign a Real-Life Parent Quest
            </h2>
          </div>

          <form onSubmit={handleAssignQuest} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-espresso">Quest Title</span>
              <input
                type="text"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="e.g. Read for 20 minutes or Organize your books"
                className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2 text-sm text-espresso"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-espresso">Instructions (English)</span>
              <textarea
                rows={2}
                value={questDesc}
                onChange={(e) => setQuestDesc(e.target.value)}
                placeholder="Describe the real-world habit or reading goal..."
                className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2 text-sm text-espresso"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-espresso">XP Reward (10–30)</span>
                <input
                  type="number"
                  min={10}
                  max={30}
                  value={questXp}
                  onChange={(e) => setQuestXp(Number(e.target.value))}
                  className="w-full rounded-xl border border-espresso/15 bg-parchment px-3 py-2 text-sm text-espresso"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-espresso">Optional Deadline</span>
                <input
                  type="date"
                  value={questDue}
                  onChange={(e) => setQuestDue(e.target.value)}
                  className="w-full rounded-xl border border-espresso/15 bg-parchment px-3 py-2 text-sm text-espresso"
                />
              </label>
            </div>
            {questFormMsg && (
              <p className="text-xs font-bold text-terracotta">{questFormMsg}</p>
            )}
            <button
              type="submit"
              className="tactile-btn w-full bg-terracotta text-white py-2.5 text-sm shadow-tactile-terracotta"
            >
              Assign Quest to {activeChild.nickname}
            </button>
          </form>

          {parentQuests.filter((pq) => pq.childId === activeChild.id).length > 0 && (
            <div className="pt-2 border-t border-espresso/10 space-y-1.5">
              <p className="text-xs font-bold text-cocoa">Assigned Quests</p>
              {parentQuests
                .filter((pq) => pq.childId === activeChild.id)
                .map((pq) => (
                  <div
                    key={pq.id}
                    className="flex items-center justify-between text-xs rounded-xl bg-parchment px-3 py-2"
                  >
                    <span className="font-bold text-espresso">{pq.title}</span>
                    <span className="uppercase text-[10px] font-bold text-cocoa">
                      {pq.status} · +{pq.rewardXp} XP
                    </span>
                  </div>
                ))}
            </div>
          )}
        </StorybookCard>
      </div>

      {/* Parental Controls & Child Profile Management */}
      <div className="grid lg:grid-cols-12 gap-5">
        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-extrabold text-espresso">
              Feature Permissions &amp; Age Band
            </h2>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-espresso">Explorer Age Group</span>
            <select
              value={activeChild.ageGroup}
              onChange={(e) => updateChildAgeGroup(activeChild.id, e.target.value as AgeGroup)}
              className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2 text-sm font-semibold text-espresso"
            >
              <option value="6-8">Junior Explorers (6–8)</option>
              <option value="9-11">Curious Discoverers (9–11)</option>
              <option value="12-14">Young Trailblazers (12–14)</option>
            </select>
          </label>

          <div className="space-y-2">
            {(
              [
                ['cameraEnabled', 'Camera Scanner & Visual Recognition'],
                ['microphoneEnabled', 'Microphone for English Speech & Sound Lab'],
                ['aiEnabled', 'English-Only AI Companion Dialogue'],
                ['voiceCapsulesEnabled', 'Intergenerational Voice Capsules'],
                ['arHabitMirrorEnabled', 'AR Habit Mirror'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl bg-parchment px-3.5 py-2.5 cursor-pointer"
              >
                <span className="text-xs font-bold text-espresso">{label}</span>
                <input
                  type="checkbox"
                  checked={controls[key]}
                  onChange={(e) =>
                    updateParentalControls(activeChild.id, { [key]: e.target.checked })
                  }
                  className="h-4 w-4 accent-terracotta"
                />
              </label>
            ))}
          </div>
        </StorybookCard>

        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-extrabold text-espresso">
              Child Profiles &amp; Data Deletion
            </h2>
          </div>

          <form onSubmit={handleCreateChild} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="New explorer nickname"
              className="flex-1 min-w-[140px] rounded-xl border border-espresso/15 bg-parchment px-3 py-2 text-xs text-espresso"
            />
            <select
              value={newAgeGroup}
              onChange={(e) => setNewAgeGroup(e.target.value as AgeGroup)}
              className="rounded-xl border border-espresso/15 bg-parchment px-3 py-2 text-xs font-bold text-espresso"
            >
              <option value="6-8">6–8</option>
              <option value="9-11">9–11</option>
              <option value="12-14">12–14</option>
            </select>
            <button
              type="submit"
              className="tactile-btn bg-sage text-espresso px-4 py-2 text-xs shadow-tactile-sage"
            >
              Add Child
            </button>
          </form>
          {childFormMsg && <p className="text-xs font-bold text-[#556B47]">{childFormMsg}</p>}

          <div className="pt-3 border-t border-espresso/10 space-y-3">
            <div className="flex items-center gap-2 text-xs text-cocoa">
              <Award className="h-4 w-4 text-terracotta" />
              <span>
                Unlocked Badges: {myBadges.map((b) => b.badgeName).join(', ') || 'None yet'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteChildData(activeChild.id);
                }}
                className="tactile-btn bg-terracotta/15 text-terracotta border border-terracotta/30 px-4 py-2 text-xs hover:bg-terracotta/25"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {activeChild.nickname}&apos;s Data
              </button>

              <button
                type="button"
                onClick={() => {
                  resetDemoApp();
                  navigate('/onboarding');
                }}
                className="tactile-btn bg-white border border-espresso/15 text-cocoa px-4 py-2 text-xs hover:bg-sandcard"
              >
                Reset Full App Session
              </button>
            </div>
          </div>
        </StorybookCard>
      </div>
    </div>
  );
}
