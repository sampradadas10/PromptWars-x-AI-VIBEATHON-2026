import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Mic,
  ShieldCheck,
  Sparkles,
  Square,
} from 'lucide-react';
import { StorybookCard } from '../../components/common/StorybookUI';
import { VOICE_CAPSULE_PROMPTS } from '../../data/signatureContent';
import { summarizeVoiceCapsule } from '../../services/aiService';
import { usePhygitalStore } from '../../store/usePhygitalStore';

export function VoiceCapsulesPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const storeTemporaryMedia = usePhygitalStore((s) => s.storeTemporaryMedia);
  const addMemoryCard = usePhygitalStore((s) => s.addMemoryCard);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const [selectedPrompt, setSelectedPrompt] = useState(VOICE_CAPSULE_PROMPTS[0]);
  const [familyRole, setFamilyRole] = useState('Grandparent');
  const [adultPermissionGranted, setAdultPermissionGranted] = useState(false);
  const [typedNotes, setTypedNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioCaptured, setAudioCaptured] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{
    storySummary: string;
    followUpQuestion: string;
    xp: number;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!activeChild) return null;
  const micAllowed = controlsByChild[activeChild.id]?.microphoneEnabled !== false;

  const startRecording = async () => {
    setMicError(null);
    if (!adultPermissionGranted) {
      setMicError(
        'Please confirm that the participating family adult gave permission before recording.'
      );
      return;
    }
    if (!micAllowed) {
      setMicError('Microphone is disabled in Parent Dashboard. You can still type the story!');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicError('Audio recording is unavailable in this browser. Type the story below!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudioCaptured(true);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError('Microphone permission denied. Use the typed interview box below!');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSaveCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedNotes.trim() && !audioCaptured) return;
    setSaving(true);
    try {
      let mediaId: string | undefined;
      if (audioCaptured) {
        const record = storeTemporaryMedia({
          childId: activeChild.id,
          mediaType: 'audio',
          extension: 'webm',
        });
        mediaId = record.id;
      }

      const aiSummary = await summarizeVoiceCapsule({
        promptTitle: selectedPrompt.title,
        familyMemberRole: familyRole,
        rawTranscript: typedNotes,
      });

      addMemoryCard({
        childId: activeChild.id,
        promptTitle: selectedPrompt.title,
        familyMemberRole: familyRole,
        transcript: aiSummary.data.transcript,
        storySummary: aiSummary.data.storySummary,
        memoryCardDescription: aiSummary.data.memoryCardDescription,
        followUpQuestion: aiSummary.data.followUpQuestion,
        adultConsentConfirmed: adultPermissionGranted || typedNotes.trim().length > 0,
        mediaId,
      });

      const reward = await completeQuest({
        questZone: 'time-travelers-attic',
        questTitle: `Voice Capsule: ${selectedPrompt.title}`,
        questType: 'family',
        aiEvaluationSummary: aiSummary.data.storySummary,
      });

      setSavedSummary({
        storySummary: aiSummary.data.storySummary,
        followUpQuestion: aiSummary.data.followUpQuestion,
        xp: reward.xpAwarded,
      });
      setTypedNotes('');
      setAudioCaptured(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sunbeam/35 px-3 py-1 text-xs font-bold text-espresso">
          <Heart className="h-3.5 w-3.5 text-terracotta" />
          Signature Feature 3 · Intergenerational Voice Capsules
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
          Family Story Capsules
        </h1>
        <p className="text-sm text-cocoa">
          Interview a parent, grandparent, or elder in English and create a forever Memory Card!
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-cocoa">
            Pick an Interview Prompt
          </h2>
          {VOICE_CAPSULE_PROMPTS.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => {
                setSelectedPrompt(prompt);
                setSavedSummary(null);
              }}
              className={`w-full text-left rounded-2xl border p-4 transition ${
                selectedPrompt.id === prompt.id
                  ? 'bg-white border-terracotta ring-2 ring-terracotta/30'
                  : 'bg-white/75 border-espresso/10 hover:bg-white'
              }`}
            >
              <h3 className="font-extrabold text-espresso text-sm">{prompt.title}</h3>
              <p className="text-xs text-cocoa mt-1">{prompt.question}</p>
            </button>
          ))}
        </div>

        <StorybookCard className="lg:col-span-7 bg-white space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-espresso">{selectedPrompt.title}</h2>
            <p className="text-sm font-semibold text-terracotta">{selectedPrompt.question}</p>
          </div>

          <form onSubmit={handleSaveCapsule} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-espresso">Who are you interviewing?</span>
              <select
                value={familyRole}
                onChange={(e) => setFamilyRole(e.target.value)}
                className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2.5 text-sm font-semibold text-espresso"
              >
                <option value="Grandparent">Grandparent</option>
                <option value="Parent">Parent</option>
                <option value="Aunt or Uncle">Aunt or Uncle</option>
                <option value="Older Sibling or Cousin">Older Sibling or Cousin</option>
              </select>
            </label>

            {/* Mandatory Adult Permission Gate */}
            <label className="flex items-start gap-2.5 rounded-2xl bg-sage/20 border border-sage/45 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={adultPermissionGranted}
                onChange={(e) => setAdultPermissionGranted(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-terracotta"
              />
              <span className="text-xs text-espresso leading-relaxed">
                <strong>Permission Confirmed:</strong> The participating family adult said “yes”
                to recording or sharing this story. (Raw audio is automatically deleted after 48
                hours.)
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="tactile-btn bg-sunbeam text-espresso px-4 py-2.5 text-sm shadow-tactile-sunbeam"
                >
                  <Mic className="h-4 w-4" />
                  Record Voice Story
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="tactile-btn bg-terracotta text-white px-4 py-2.5 text-sm animate-pulse"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </button>
              )}

              {audioCaptured && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B47]">
                  <ShieldCheck className="h-4 w-4" />
                  Voice clip ready (48-hour vault)
                </span>
              )}
            </div>

            {micError && (
              <p className="text-xs font-semibold text-terracotta bg-terracotta/10 rounded-xl px-3 py-2">
                {micError}
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-bold text-espresso">
                Story Transcript or Typed Notes (English)
              </span>
              <textarea
                rows={4}
                value={typedNotes}
                onChange={(e) => setTypedNotes(e.target.value)}
                placeholder="Type what your family member shared—for example: My grandfather said he used to play marbles and build paper kites every Saturday afternoon..."
                className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
              />
            </label>

            <button
              type="submit"
              disabled={saving || (!typedNotes.trim() && !audioCaptured)}
              className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta"
            >
              <Sparkles className="h-4 w-4" />
              {saving ? 'Crafting Illustrated Memory Card...' : 'Save Memory Card & Earn +30 XP'}
            </button>
          </form>

          {savedSummary && (
            <div className="rounded-2xl bg-sage/25 border border-sage/50 p-4 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-espresso text-sm">
                <CheckCircle2 className="h-4 w-4 text-[#556B47]" />
                Memory Card Saved &amp; Heritage Badge Unlocked! (+{savedSummary.xp} XP)
              </div>
              <p className="text-sm text-espresso">{savedSummary.storySummary}</p>
              <p className="text-xs font-semibold text-terracotta">
                Next Follow-up Question: {savedSummary.followUpQuestion}
              </p>
            </div>
          )}
        </StorybookCard>
      </div>
    </div>
  );
}
