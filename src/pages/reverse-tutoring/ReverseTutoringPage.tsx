import { useRef, useState } from 'react';
import {
  CheckCircle2,
  MessageCircleQuestion,
  Mic,
  MicOff,
  Send,
  Sparkles,
} from 'lucide-react';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import { StorybookCard } from '../../components/common/StorybookUI';
import { REVERSE_TUTORING_TOPICS } from '../../data/signatureContent';
import { evaluateReverseTutoring } from '../../services/aiService';
import {
  isEnglishSpeechRecognitionSupported,
  startEnglishSpeechRecognition,
} from '../../services/speechService';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import type { ReverseTutoringEvaluation } from '../../types/phygital';

export function ReverseTutoringPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);
  const setCompanionState = usePhygitalStore((s) => s.setCompanionState);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const [selectedTopicId, setSelectedTopicId] = useState(REVERSE_TUTORING_TOPICS[0].id);
  const [explanation, setExplanation] = useState('');
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<ReverseTutoringEvaluation | null>(null);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  if (!activeChild) return null;
  const controls = controlsByChild[activeChild.id];
  const micAllowed = controls?.microphoneEnabled !== false;
  const topic =
    REVERSE_TUTORING_TOPICS.find((t) => t.id === selectedTopicId) ?? REVERSE_TUTORING_TOPICS[0];

  const handleToggleMic = () => {
    setMicError(null);
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }

    if (!micAllowed) {
      setMicError('Microphone is turned off in Parent Dashboard. Please type your explanation!');
      return;
    }

    setListening(true);
    stopListeningRef.current = startEnglishSpeechRecognition({
      onTranscript: (text) => setExplanation(text),
      onError: (msg) => setMicError(msg),
      onEnd: () => setListening(false),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) return;
    setEvaluating(true);
    setXpAwarded(null);
    try {
      const res = await evaluateReverseTutoring({
        topic,
        explanation,
        ageGroup: activeChild.ageGroup,
      });
      setEvaluation(res.data);
      setCompanionState('celebration', res.data.dialogue.dialogue_turns);
      const reward = await completeQuest({
        questZone: 'word-weavers-treehouse',
        questTitle: `Reverse Tutoring: ${topic.title}`,
        questType: 'speaking',
        aiEvaluationSummary: res.data.strengths,
        featureTag: 'reverse_tutoring',
      });
      setXpAwarded(reward.xpAwarded);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-bold text-terracotta">
          <MessageCircleQuestion className="h-3.5 w-3.5" />
          Signature Feature 1 · Reverse Tutoring
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
          Teach Leo &amp; Maya!
        </h1>
        <p className="text-sm text-cocoa">
          Leo and Maya are super curious—but they need <strong>you</strong> to be the teacher!
          Explain an idea in your own English words by voice or text.
        </p>
      </div>

      {/* Topic Selector */}
      <div className="flex flex-wrap gap-2">
        {REVERSE_TUTORING_TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedTopicId(t.id);
              setEvaluation(null);
              setXpAwarded(null);
            }}
            className={`rounded-2xl px-3.5 py-2 text-xs font-bold border transition ${
              t.id === topic.id
                ? 'bg-terracotta text-white border-terracotta shadow-sm'
                : 'bg-white text-espresso border-espresso/10 hover:bg-sandcard'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <StorybookCard className="lg:col-span-7 bg-white space-y-4">
          <CompanionDialogueBox
            title="Leo & Maya’s Question"
            turns={[
              { character: 'leo', emotion: 'curious', text: topic.leoQuestion },
              {
                character: 'maya',
                emotion: 'encouraging',
                text: 'Take your time! Explain it like you are telling a friend—every style of English is welcome!',
              },
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-espresso">
                Your English Explanation (Speak or Type)
              </span>
              <button
                type="button"
                onClick={handleToggleMic}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  listening
                    ? 'bg-terracotta text-white animate-pulse'
                    : 'bg-sandcard text-espresso hover:bg-sunbeam/35'
                }`}
              >
                {listening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    {isEnglishSpeechRecognitionSupported()
                      ? 'Speak in English'
                      : 'Voice Unavailable (Use Text)'}
                  </>
                )}
              </button>
            </div>

            {micError && (
              <p className="text-xs font-semibold text-terracotta bg-terracotta/10 rounded-xl px-3 py-2">
                {micError}
              </p>
            )}

            <textarea
              rows={4}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="For example: The sun warms up water in lakes and oceans so it turns into invisible vapor, rises up, cools into tiny droplets, and falls back as rain..."
              className="w-full rounded-2xl border border-espresso/15 bg-parchment px-4 py-3 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
            />

            <button
              type="submit"
              disabled={evaluating || explanation.trim().length < 5}
              className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta hover:bg-[#b56d4e]"
            >
              <Send className="h-4 w-4" />
              {evaluating ? 'Leo & Maya are thinking...' : 'Teach Leo & Maya'}
            </button>
          </form>
        </StorybookCard>

        <StorybookCard className="lg:col-span-5 bg-white/90 space-y-4">
          <h2 className="text-lg font-extrabold text-espresso">Teaching Feedback</h2>
          {evaluation ? (
            <div className="space-y-4">
              {xpAwarded !== null && (
                <div className="rounded-xl bg-sage/25 border border-sage/50 px-3.5 py-2.5 flex items-center gap-2 text-sm font-bold text-espresso">
                  <CheckCircle2 className="h-4 w-4 text-[#556B47]" />
                  Awesome teaching! +{xpAwarded} XP earned!
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="rounded-xl bg-parchment p-3 border border-espresso/10">
                  <p className="text-lg font-extrabold text-terracotta">
                    {evaluation.conceptualUnderstanding}/5
                  </p>
                  <p className="text-[11px] font-bold text-cocoa">Understanding</p>
                </div>
                <div className="rounded-xl bg-parchment p-3 border border-espresso/10">
                  <p className="text-lg font-extrabold text-terracotta">
                    {evaluation.clarity}/5
                  </p>
                  <p className="text-[11px] font-bold text-cocoa">Clarity</p>
                </div>
              </div>

              <div className="rounded-xl bg-sunbeam/20 border border-sunbeam/50 p-3 text-xs text-espresso">
                <strong>What shone:</strong> {evaluation.strengths}
              </div>

              <CompanionDialogueBox turns={evaluation.dialogue.dialogue_turns} />
            </div>
          ) : (
            <div className="py-10 text-center space-y-2 text-cocoa">
              <Sparkles className="h-9 w-9 text-sunbeam mx-auto" />
              <p className="text-sm font-semibold">
                Explain the concept in your own words to see Leo and Maya’s amazed reaction!
              </p>
              <p className="text-xs">
                We celebrate curiosity and ideas—never penalizing accents or small grammar slips.
              </p>
            </div>
          )}
        </StorybookCard>
      </div>
    </div>
  );
}
