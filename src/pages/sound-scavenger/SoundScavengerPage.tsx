import { useEffect, useRef, useState } from 'react';
import { AudioLines, CheckCircle2, Mic, MicOff, Wind } from 'lucide-react';
import { StorybookCard } from '../../components/common/StorybookUI';
import { SOUND_SCAVENGER_MISSIONS } from '../../data/signatureContent';
import { usePhygitalStore } from '../../store/usePhygitalStore';

export function SoundScavengerPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const [selectedMission, setSelectedMission] = useState(SOUND_SCAVENGER_MISSIONS[0]);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [soundLevel, setSoundLevel] = useState(0); // 0 - 100
  const [balloonAltitude, setBalloonAltitude] = useState(45); // 0 - 100
  const [steadySeconds, setSteadySeconds] = useState(0);
  const [completedXp, setCompletedXp] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAudioMonitor = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void audioCtxRef.current?.close();
    rafRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    setListening(false);
  };

  useEffect(() => {
    return () => stopAudioMonitor();
  }, []);

  if (!activeChild) return null;
  const micAllowed = controlsByChild[activeChild.id]?.microphoneEnabled !== false;

  const startAudioMonitor = async () => {
    setMicError(null);
    if (!micAllowed) {
      setMicError('Microphone is disabled in Parent Dashboard.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(
        'Live microphone audio signal analysis is unavailable in this browser. You can practice with the Calm Voice Simulator slider below!'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      streamRef.current = stream;
      audioCtxRef.current = ctx;
      setListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastTick = performance.now();

      const loop = (now: number) => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, Math.round(rms * 360));
        setSoundLevel(level);

        const dt = (now - lastTick) / 1000;
        lastTick = now;
        // Calm steady speaking window (15 - 65) lifts and stabilizes Maya's balloon
        setBalloonAltitude((prev) => {
          const target = level >= 12 && level <= 70 ? 72 : level > 70 ? 88 : 32;
          return Math.round(prev + (target - prev) * Math.min(1, dt * 2.5));
        });
        if (level >= 12 && level <= 70) {
          setSteadySeconds((s) => Math.min(10, s + dt));
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMicError(
        'Microphone access was denied. You can explore using the Calm Voice Simulator below!'
      );
    }
  };

  const handleCompleteMission = async () => {
    stopAudioMonitor();
    const reward = await completeQuest({
      questZone: 'world-explorers-compass',
      questTitle: `Sound Scavenger: ${selectedMission.title}`,
      questType: 'discovery',
      aiEvaluationSummary: `Investigated real-world acoustics for "${selectedMission.title}" locally in browser.`,
      featureTag: 'sound_scavenger',
    });
    setCompletedXp(reward.xpAwarded);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-bold text-terracotta">
          <AudioLines className="h-3.5 w-3.5" />
          Signature Feature 4 · Sound-Scavenger Adventures
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
          Sound-Scavenger Lab &amp; Hot-Air Balloon
        </h1>
        <p className="text-sm text-cocoa">
          Listen closely to real sounds around you! Audio signal analysis stays 100% inside your
          browser—never recorded continuously or uploaded.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Sound Mission List */}
        <div className="lg:col-span-5 space-y-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-cocoa">
            Sensory Listening Missions
          </h2>
          {SOUND_SCAVENGER_MISSIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedMission(m);
                setCompletedXp(null);
              }}
              className={`w-full text-left rounded-2xl border p-4 transition ${
                selectedMission.id === m.id
                  ? 'bg-white border-terracotta ring-2 ring-terracotta/30'
                  : 'bg-white/75 border-espresso/10 hover:bg-white'
              }`}
            >
              <h3 className="font-extrabold text-espresso text-sm">{m.title}</h3>
              <p className="text-xs text-cocoa mt-1">{m.instruction}</p>
            </button>
          ))}
        </div>

        {/* Audio Meter + Hot Air Balloon Game */}
        <StorybookCard className="lg:col-span-7 bg-white space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-espresso">{selectedMission.title}</h2>
            <p className="text-xs text-cocoa">{selectedMission.hint}</p>
          </div>

          {/* Hot Air Balloon Canvas */}
          <div className="relative h-52 overflow-hidden rounded-2xl border border-espresso/10 bg-gradient-to-b from-[#EAF2F8] via-[#FAF8F5] to-[#DCE6D5] p-4">
            <div className="absolute top-3 left-4 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-espresso">
              <Wind className="h-3.5 w-3.5 text-terracotta" />
              Maya’s Balloon · Speak calmly &amp; steadily to glide!
            </div>

            {/* Target Altitude Band */}
            <div
              className="absolute inset-x-0 top-14 h-16 border-y border-dashed border-sage/60 bg-sage/10"
              aria-hidden="true"
            />

            {/* Animated Hot Air Balloon */}
            <div
              className="absolute left-1/2 -translate-x-1/2 transition-all duration-150 flex flex-col items-center"
              style={{ bottom: `${Math.max(10, Math.min(72, balloonAltitude * 0.72))}%` }}
            >
              <div className="h-12 w-10 rounded-full bg-gradient-to-b from-terracotta to-sunbeam border-2 border-espresso/40 shadow-sm" />
              <div className="h-2.5 w-3 border-x border-espresso/50" />
              <div className="h-4 w-5 rounded bg-[#7A583E]" />
            </div>

            <div className="absolute bottom-3 right-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-espresso">
              Sound Energy: {soundLevel}%
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!listening ? (
              <button
                type="button"
                onClick={startAudioMonitor}
                className="tactile-btn bg-terracotta text-white px-5 py-2.5 text-sm shadow-tactile-terracotta"
              >
                <Mic className="h-4 w-4" />
                Start Local Sound Sensor
              </button>
            ) : (
              <button
                type="button"
                onClick={stopAudioMonitor}
                className="tactile-btn bg-espresso text-white px-5 py-2.5 text-sm"
              >
                <MicOff className="h-4 w-4" />
                Stop Sensor
              </button>
            )}

            <button
              type="button"
              onClick={handleCompleteMission}
              disabled={completedXp !== null}
              className="tactile-btn bg-sage text-espresso px-5 py-2.5 text-sm shadow-tactile-sage"
            >
              <CheckCircle2 className="h-4 w-4" />
              {completedXp !== null
                ? `Completed! +${completedXp} XP`
                : 'I Found This Sound! (+20 XP)'}
            </button>
          </div>

          {micError && (
            <div className="space-y-2 rounded-xl bg-sunbeam/20 border border-sunbeam px-3.5 py-2.5 text-xs text-espresso">
              <p className="font-semibold">{micError}</p>
              <label className="flex items-center gap-3">
                <span className="font-bold">Calm Voice Simulator:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={soundLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSoundLevel(val);
                    setBalloonAltitude(val >= 15 && val <= 68 ? 68 : val > 68 ? 86 : 30);
                  }}
                  className="accent-terracotta flex-1"
                />
              </label>
            </div>
          )}

          <p className="text-[11px] text-cocoa">
            Privacy Note: Steady calm voice counter: {steadySeconds.toFixed(1)}s. Acoustic energy is
            used solely for play—never to judge emotions or record background conversations.
          </p>
        </StorybookCard>
      </div>
    </div>
  );
}
