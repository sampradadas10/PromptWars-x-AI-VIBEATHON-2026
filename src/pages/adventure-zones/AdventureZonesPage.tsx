import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import { StorybookCard } from '../../components/common/StorybookUI';
import { ADVENTURE_ZONES, QUEST_CATALOG } from '../../data/quests';
import { requestCompanionDialogue } from '../../services/aiService';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import type { QuestDefinition, ZoneId } from '../../types/phygital';

export function AdventureZonesPage() {
  const { zoneId } = useParams<{ zoneId?: ZoneId }>();
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const questProgress = usePhygitalStore((s) => s.questProgress);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);
  const setCompanionState = usePhygitalStore((s) => s.setCompanionState);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const [selectedQuest, setSelectedQuest] = useState<QuestDefinition | null>(null);
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    xp: number;
    badges: string[];
    turns: { character: 'leo' | 'maya'; emotion: 'amazed' | 'happy' | 'curious'; text: string }[];
  } | null>(null);

  if (!activeChild) return null;

  const activeZone = zoneId ? ADVENTURE_ZONES.find((z) => z.id === zoneId) : null;
  const completedTitles = new Set(
    questProgress.filter((p) => p.childId === activeChild.id).map((p) => p.questTitle)
  );

  const handleCompleteQuest = async (quest: QuestDefinition) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const note =
        reflection.trim() || `Completed "${quest.title}" in the real world with careful observation.`;
      const aiRes = await requestCompanionDialogue({
        trigger: quest.zoneId === 'daily-hero-training' ? 'habit_completed' : 'object_scan',
        ageGroup: activeChild.ageGroup,
        childInput: note,
        context: `Adventure Zone: ${quest.zoneId}, Quest: ${quest.title}`,
      });

      const rewardRes = await completeQuest({
        questZone: quest.zoneId,
        questTitle: quest.title,
        questType: quest.questType,
        aiEvaluationSummary: note,
      });

      setCompanionState('celebration', aiRes.data.dialogue_turns);
      setFeedback({
        xp: rewardRes.xpAwarded,
        badges: rewardRes.newBadges.map((b) => b.badgeName),
        turns: aiRes.data.dialogue_turns.map((t) => ({
          character: t.character,
          emotion: t.emotion === 'surprised' || t.emotion === 'thinking' || t.emotion === 'encouraging' ? 'happy' : t.emotion,
          text: t.text,
        })),
      });
      setReflection('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeZone) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso">
            Five Adventure Zones
          </h1>
          <p className="text-sm text-cocoa">
            Choose a storybook world below. Every quest is adapted for{' '}
            <strong className="text-espresso">Ages {activeChild.ageGroup}</strong> in English.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {ADVENTURE_ZONES.map((zone) => {
            const zoneQuests = QUEST_CATALOG.filter((q) => q.zoneId === zone.id);
            const doneCount = zoneQuests.filter((q) => completedTitles.has(q.title)).length;
            return (
              <Link
                key={zone.id}
                to={`/zones/${zone.id}`}
                className="storybook-card bg-white p-6 hover:-translate-y-0.5 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${zone.accentBg} ${zone.accentText}`}
                    >
                      <Compass className="h-3.5 w-3.5" />
                      {zone.learningFocus}
                    </span>
                    <span className="text-xs font-bold text-cocoa">
                      {doneCount}/{zoneQuests.length} done
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-espresso">{zone.name}</h2>
                  <p className="text-sm text-cocoa">{zone.tagline}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-terracotta pt-2 border-t border-espresso/10">
                  <span>Enter {zone.name}</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const zoneQuests = QUEST_CATALOG.filter((q) => q.zoneId === activeZone.id);

  return (
    <div className="space-y-6">
      <Link
        to="/zones"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-terracotta hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Adventure Zones
      </Link>

      <StorybookCard className="bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${activeZone.accentBg} ${activeZone.accentText}`}
            >
              {activeZone.learningFocus}
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
              {activeZone.name}
            </h1>
            <p className="text-sm text-cocoa mt-1">{activeZone.tagline}</p>
          </div>
          {activeZone.id === 'time-travelers-attic' && (
            <Link
              to="/voice-capsules"
              className="tactile-btn bg-sunbeam text-espresso px-4 py-2 text-sm shadow-tactile-sunbeam"
            >
              Open Voice Capsules
            </Link>
          )}
          {activeZone.id === 'daily-hero-training' && (
            <Link
              to="/habit-mirror"
              className="tactile-btn bg-sage text-espresso px-4 py-2 text-sm shadow-tactile-sage"
            >
              Open AR Habit Mirror
            </Link>
          )}
        </div>

        <CompanionDialogueBox
          turns={[
            { character: 'leo', emotion: 'curious', text: activeZone.leoIntro },
            { character: 'maya', emotion: 'encouraging', text: activeZone.mayaIntro },
          ]}
        />
      </StorybookCard>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-3">
          <h2 className="text-lg font-extrabold text-espresso">
            Choose a Real-World Quest (Ages {activeChild.ageGroup})
          </h2>
          {zoneQuests.map((quest) => {
            const isDone = completedTitles.has(quest.title);
            const isSelected = selectedQuest?.id === quest.id;
            return (
              <button
                key={quest.id}
                type="button"
                onClick={() => {
                  setSelectedQuest(quest);
                  setFeedback(null);
                }}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  isSelected
                    ? 'bg-white border-terracotta ring-2 ring-terracotta/30 shadow-sm'
                    : 'bg-white/80 border-espresso/10 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-espresso">{quest.title}</h3>
                    <p className="text-xs text-cocoa mt-0.5">{quest.subtitle}</p>
                  </div>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage/30 px-2.5 py-0.5 text-xs font-bold text-espresso shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-cocoa font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {quest.estimatedMinutes} min
                  </span>
                  {quest.requiresAdultAssistance && (
                    <span className="inline-flex items-center gap-1 text-terracotta">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Adult assistance
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-6">
          {selectedQuest ? (
            <StorybookCard className="bg-white space-y-4 sticky top-24">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
                  Active Adventure Guide
                </span>
                <h3 className="text-xl font-extrabold text-espresso">{selectedQuest.title}</h3>
                <p className="text-sm text-espresso leading-relaxed">
                  {selectedQuest.promptByAge[activeChild.ageGroup]}
                </p>
              </div>

              <div className="rounded-2xl bg-sandcard/70 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-cocoa">
                  Real-World Steps
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-espresso">
                  {selectedQuest.stepsByAge[activeChild.ageGroup].map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-sunbeam/70 bg-sunbeam/20 p-3 text-xs text-espresso flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#B47D18] shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Note:</strong> {selectedQuest.safetyNote}
                </span>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-espresso">
                  Tell Leo &amp; Maya what you discovered (in English)
                </span>
                <textarea
                  rows={3}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Share what you observed, wrote, or heard in the real world..."
                  className="w-full rounded-xl border border-espresso/15 bg-parchment px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                />
              </label>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCompleteQuest(selectedQuest)}
                className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta hover:bg-[#b56d4e]"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? 'Checking with Leo & Maya...' : 'Complete Real-World Quest'}
              </button>

              {feedback && (
                <div className="space-y-3 pt-2 border-t border-espresso/10">
                  <div className="rounded-xl bg-sage/25 border border-sage/50 px-4 py-2.5 text-sm font-bold text-espresso">
                    Quest Complete! +{feedback.xp} XP earned!
                    {feedback.badges.length > 0 &&
                      ` · New Badge(s): ${feedback.badges.join(', ')}`}
                  </div>
                  <CompanionDialogueBox turns={feedback.turns} />
                </div>
              )}
            </StorybookCard>
          ) : (
            <StorybookCard className="bg-white/70 text-center py-12 space-y-2">
              <Compass className="h-10 w-10 text-terracotta mx-auto" />
              <p className="font-extrabold text-espresso">Select a quest to begin</p>
              <p className="text-sm text-cocoa">
                Step away from the screen to try it in real life, then come back to tell Leo and
                Maya!
              </p>
            </StorybookCard>
          )}
        </div>
      </div>
    </div>
  );
}
