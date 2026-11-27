import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Info, Play, Sparkles, Sun, XCircle } from 'lucide-react';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import { StorybookCard, SunBatteryMeter } from '../../components/common/StorybookUI';
import { OFFLINE_MISSIONS } from '../../data/signatureContent';
import { usePhygitalStore } from '../../store/usePhygitalStore';

const TIMER_OPTIONS: (15 | 20 | 30)[] = [15, 20, 30];

export function OfflineMissionsPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const offlineSessions = usePhygitalStore((s) => s.offlineSessions);
  const startOfflineMission = usePhygitalStore((s) => s.startOfflineMission);
  const completeOfflineMission = usePhygitalStore((s) => s.completeOfflineMission);
  const cancelOfflineMission = usePhygitalStore((s) => s.cancelOfflineMission);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const [selectedMission, setSelectedMission] = useState(OFFLINE_MISSIONS[0]);
  const [durationMinutes, setDurationMinutes] = useState<15 | 20 | 30>(15);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeSession = activeChild
    ? offlineSessions.find((s) => s.childId === activeChild.id && s.status === 'active')
    : undefined;

  useEffect(() => {
    if (!activeSession) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  if (!activeChild) return null;

  const remainingMs = activeSession
    ? Math.max(0, new Date(activeSession.targetCompletedAt).getTime() - nowMs)
    : 0;
  const elapsedMs = activeSession
    ? Math.max(0, nowMs - new Date(activeSession.startedAt).getTime())
    : 0;

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStatusMessage(null);
    const now = Date.now();
    setNowMs(now);
    startOfflineMission({
      childId: activeChild.id,
      missionId: selectedMission.id,
      missionTitle: selectedMission.title,
      durationMinutes,
      startedAtMs: now,
    });
  };

  const handleClaim = () => {
    if (!activeSession) return;
    const res = completeOfflineMission(activeSession.id, Date.now());
    if (res.ok) {
      setStatusMessage(
        `Sun-Battery charged! +${res.xpAwarded} XP awarded for real-world screen-free play!`
      );
    } else {
      setStatusMessage(res.reason ?? 'Keep going on your offline adventure!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sunbeam/35 px-3 py-1 text-xs font-bold text-espresso">
            <Sun className="h-3.5 w-3.5 text-[#B47D18]" />
            Signature Feature 5 · Offline Sun-Battery
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
            Put the Screen Down &amp; Power Up!
          </h1>
          <p className="text-sm text-cocoa">
            Leo and Maya’s world gains bright solar energy when you explore the real world away
            from your screen.
          </p>
        </div>
      </div>

      <SunBatteryMeter level={activeChild.sunBatteryLevel} />

      {activeSession ? (
        <StorybookCard className="bg-white space-y-5 text-center py-8">
          <Sun className="h-12 w-12 text-[#B47D18] mx-auto animate-pulse" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-terracotta">
              Active Screen-Free Mission
            </p>
            <h2 className="text-2xl font-extrabold text-espresso">{activeSession.missionTitle}</h2>
            <p className="text-sm text-cocoa">
              Put your device aside now and return when the timer finishes!
            </p>
          </div>

          <div className="inline-flex flex-col items-center rounded-3xl bg-parchment border border-sunbeam px-8 py-5">
            <span className="text-xs font-bold text-cocoa uppercase tracking-wider">
              Time Remaining ({activeSession.durationMinutes} min mission)
            </span>
            <span className="mt-1 text-4xl font-extrabold text-espresso tabular-nums">
              {formatDuration(remainingMs)}
            </span>
            <span className="mt-1 text-xs text-cocoa">
              Elapsed away-time: {formatDuration(elapsedMs)}
            </span>
          </div>

          {statusMessage && (
            <div className="max-w-md mx-auto rounded-xl bg-sunbeam/25 border border-sunbeam px-4 py-2.5 text-xs font-bold text-espresso">
              {statusMessage}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleClaim}
              className="tactile-btn bg-terracotta text-white px-6 py-3 text-sm shadow-tactile-terracotta"
            >
              <CheckCircle2 className="h-4 w-4" />
              {remainingMs === 0 ? 'I Returned! Charge Sun-Battery' : 'Check Elapsed Time'}
            </button>

            <button
              type="button"
              onClick={() => cancelOfflineMission(activeSession.id)}
              className="tactile-btn bg-white border border-espresso/15 text-cocoa px-4 py-3 text-sm"
            >
              <XCircle className="h-4 w-4" />
              Cancel Mission
            </button>
          </div>
        </StorybookCard>
      ) : (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {OFFLINE_MISSIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMission(m)}
                className={`text-left rounded-2xl border p-4 transition ${
                  selectedMission.id === m.id
                    ? 'bg-white border-terracotta ring-2 ring-terracotta/30'
                    : 'bg-white/80 border-espresso/10 hover:bg-white'
                }`}
              >
                <h3 className="font-extrabold text-espresso text-sm">{m.title}</h3>
                <p className="text-xs text-cocoa mt-1 leading-relaxed">{m.description}</p>
              </button>
            ))}
          </div>

          <StorybookCard className="lg:col-span-5 bg-white space-y-4">
            <h2 className="text-lg font-extrabold text-espresso">Launch Offline Mission</h2>
            <p className="text-sm text-cocoa">{selectedMission.description}</p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-espresso flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-terracotta" />
                Choose Screen-Free Duration
              </span>
              <div className="grid grid-cols-3 gap-2">
                {TIMER_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`rounded-xl py-2.5 text-sm font-extrabold border transition ${
                      durationMinutes === mins
                        ? 'bg-sunbeam border-[#C4A24F] text-espresso'
                        : 'bg-parchment border-espresso/10 text-cocoa hover:bg-sandcard'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta"
            >
              <Play className="h-4 w-4" />
              {`Start ${durationMinutes}-Minute Offline Mission`}
            </button>

            {statusMessage && (
              <div className="rounded-xl bg-sage/25 border border-sage/50 px-3.5 py-2.5 text-xs font-bold text-espresso flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#556B47]" />
                {statusMessage}
              </div>
            )}

            <CompanionDialogueBox
              turns={[
                {
                  character: 'maya',
                  emotion: 'happy',
                  text: 'We never reward staring at the screen! Go enjoy the real world and come back when your timer is ready!',
                },
              ]}
            />
          </StorybookCard>
        </div>
      )}

      {/* Honest PWA background-tracking disclosure */}
      <div className="rounded-2xl border border-espresso/10 bg-white/80 p-4 flex items-start gap-3 text-xs text-cocoa">
        <Info className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
        <p>
          <strong>How Timing Works (PWA Web MVP):</strong> PHYGITAL calculates elapsed time using
          persistent timestamps (`startedAt` and `targetCompletedAt`) when you return to the app.
          Web browsers cannot verify hardware screen-lock state; future native Capacitor/Expo builds
          will integrate OS AppState &amp; Screen Time hooks for background lock awareness.
        </p>
      </div>
    </div>
  );
}
