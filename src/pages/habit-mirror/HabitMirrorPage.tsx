import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  HeartHandshake,
  Info,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { StorybookCard } from '../../components/common/StorybookUI';
import { usePhygitalStore } from '../../store/usePhygitalStore';

const HABIT_MISSIONS = [
  { id: 'hands', title: 'Handwashing Splash', creature: 'Bubbly Germ Sprite' },
  { id: 'desk', title: 'Tidy Study Desk', creature: 'Dusty Clutter Gremlin' },
  { id: 'waste', title: 'Recycle & Waste Sort', creature: 'Paper-Pile Imp' },
  { id: 'brush', title: 'Sparkly Toothbrush Time', creature: 'Sugar-Bug Rascal' },
];

export function HabitMirrorPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const ecosystemByChild = usePhygitalStore((s) => s.ecosystemByChild);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);
  const growEcosystemHabit = usePhygitalStore((s) => s.growEcosystemHabit);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedHabit, setSelectedHabit] = useState(HABIT_MISSIONS[0]);
  const [mirrorActive, setMirrorActive] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);
  const [transformed, setTransformed] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!activeChild) return null;
  const cameraAllowed = controlsByChild[activeChild.id]?.cameraEnabled !== false;
  const ecosystem = ecosystemByChild[activeChild.id] ?? {
    sprouts: 2,
    butterflies: 1,
    flowers: 1,
    tidyScore: 20,
  };

  const startMirror = async () => {
    setMirrorError(null);
    if (!cameraAllowed) {
      setMirrorError('Camera is turned off in Parent Dashboard. Use Parent Confirmation below!');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMirrorError('Live camera mirror is unavailable here—using Illustrated AR Mirror mode!');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMirrorActive(true);
    } catch {
      setMirrorError('Camera permission denied—continuing in Illustrated AR Mirror mode!');
    }
  };

  const handleConfirmHabit = async (confirmedBy: 'selfie' | 'parent') => {
    setTransformed(true);
    growEcosystemHabit(activeChild.id, selectedHabit.title);
    const reward = await completeQuest({
      questZone: 'daily-hero-training',
      questTitle: `AR Habit Mirror: ${selectedHabit.title}`,
      questType: 'habit',
      aiEvaluationSummary: `Completed "${selectedHabit.title}" (${confirmedBy === 'parent' ? 'parent-confirmed' : 'habit mirror check'}).`,
    });
    setEarnedXp(reward.xpAwarded);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/30 px-3 py-1 text-xs font-bold text-espresso">
          <HeartHandshake className="h-3.5 w-3.5 text-[#556B47]" />
          Signature Feature 6 · AR Habit Mirror
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
          AR Habit Mirror &amp; Living Room Ecosystem
        </h1>
        <p className="text-sm text-cocoa">
          Complete a healthy real-world habit to transform playful clutter sprites into friendly
          garden helpers!
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HABIT_MISSIONS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              setSelectedHabit(h);
              setTransformed(false);
              setEarnedXp(null);
            }}
            className={`rounded-2xl px-3.5 py-2 text-xs font-bold border transition ${
              selectedHabit.id === h.id
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-espresso border-espresso/10 hover:bg-sandcard'
            }`}
          >
            {h.title}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <StorybookCard className="lg:col-span-7 bg-white space-y-4">
          {/* AR Camera / Illustrated Overlay Viewport */}
          <div className="relative overflow-hidden rounded-2xl border border-espresso/15 bg-gradient-to-b from-[#FAF3E4] to-[#E5EBDF] aspect-video flex items-center justify-center">
            {mirrorActive && (
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
              />
            )}

            {/* Playful AR Creature Overlay */}
            <motion.div
              animate={
                transformed
                  ? { scale: [1, 1.2, 1], y: [0, -10, 0] }
                  : { x: [-12, 12, -12], rotate: [-4, 4, -4] }
              }
              transition={{ repeat: Infinity, duration: transformed ? 2.2 : 1.8 }}
              className="relative z-10 flex flex-col items-center gap-2 rounded-3xl bg-white/85 backdrop-blur-sm px-6 py-4 border border-espresso/15 shadow-storybook"
            >
              {transformed ? (
                <>
                  <Sprout className="h-12 w-12 text-[#556B47]" />
                  <p className="font-extrabold text-espresso text-sm">
                    Friendly Bloom Friend!
                  </p>
                  <p className="text-xs text-cocoa">
                    Your {selectedHabit.title} grew your ecosystem!
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 text-terracotta" />
                  <p className="font-extrabold text-espresso text-sm">
                    {selectedHabit.creature} Spotted!
                  </p>
                  <p className="text-xs text-cocoa">
                    Do “{selectedHabit.title}” in real life to transform it!
                  </p>
                </>
              )}
            </motion.div>
          </div>

          {mirrorError && (
            <p className="text-xs font-semibold text-cocoa bg-sunbeam/20 rounded-xl px-3 py-2">
              {mirrorError}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5">
            {!mirrorActive && (
              <button
                type="button"
                onClick={startMirror}
                className="tactile-btn bg-white border border-espresso/15 text-espresso px-4 py-2.5 text-sm hover:bg-sandcard"
              >
                <Camera className="h-4 w-4" />
                Open Live AR Mirror
              </button>
            )}
            <button
              type="button"
              onClick={() => handleConfirmHabit('selfie')}
              disabled={transformed}
              className="tactile-btn flex-1 bg-terracotta text-white px-4 py-2.5 text-sm shadow-tactile-terracotta"
            >
              <CheckCircle2 className="h-4 w-4" />
              {transformed ? 'Transformed!' : 'I Did It! Check Mirror'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmHabit('parent')}
              disabled={transformed}
              className="tactile-btn bg-sage text-espresso px-4 py-2.5 text-sm shadow-tactile-sage"
            >
              Parent Confirmed
            </button>
          </div>

          {earnedXp !== null && (
            <div className="rounded-xl bg-sage/25 border border-sage/50 px-4 py-2.5 text-sm font-bold text-espresso">
              Habit celebrated! +{earnedXp} XP earned and a new sprout bloomed!
            </div>
          )}
        </StorybookCard>

        <StorybookCard className="lg:col-span-5 bg-white space-y-4">
          <h2 className="text-lg font-extrabold text-espresso">Your Virtual Room Ecosystem</h2>
          <p className="text-xs text-cocoa">
            Every everyday hero habit adds real life and color to your digital sanctuary.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-parchment p-4 border border-espresso/10">
              <p className="text-2xl font-extrabold text-[#556B47]">{ecosystem.sprouts}</p>
              <p className="text-xs font-bold text-cocoa">Sprouts</p>
            </div>
            <div className="rounded-2xl bg-parchment p-4 border border-espresso/10">
              <p className="text-2xl font-extrabold text-terracotta">{ecosystem.flowers}</p>
              <p className="text-xs font-bold text-cocoa">Flowers</p>
            </div>
            <div className="rounded-2xl bg-parchment p-4 border border-espresso/10">
              <p className="text-2xl font-extrabold text-[#B47D18]">{ecosystem.butterflies}</p>
              <p className="text-xs font-bold text-cocoa">Butterflies</p>
            </div>
            <div className="rounded-2xl bg-parchment p-4 border border-espresso/10">
              <p className="text-2xl font-extrabold text-espresso">{ecosystem.tidyScore}%</p>
              <p className="text-xs font-bold text-cocoa">Harmony Score</p>
            </div>
          </div>

          <div className="rounded-2xl bg-sandcard/70 p-3.5 text-xs text-cocoa flex items-start gap-2">
            <Info className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
            <span>
              <strong>Honest Hygiene &amp; AR Note:</strong> Camera overlays in this web MVP are
              playful habit reminders—camera images never medically verify hygiene. Future native
              releases can plug into ARKit / ARCore depth tracking.
            </span>
          </div>
        </StorybookCard>
      </div>
    </div>
  );
}
