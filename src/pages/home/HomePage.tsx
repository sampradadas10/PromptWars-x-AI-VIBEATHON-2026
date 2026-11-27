import { Link } from 'react-router-dom';
import {
  AudioLines,
  Camera,
  CheckCircle2,
  Compass,
  HeartHandshake,
  MessageCircleQuestion,
  Mic,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Companion3DStage } from '../../components/characters/Companion3DStage';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import {
  BadgeChip,
  StorybookCard,
  SunBatteryMeter,
  XpProgressBar,
} from '../../components/common/StorybookUI';
import { ADVENTURE_ZONES, QUEST_CATALOG } from '../../data/quests';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import { getAgeBandLabel, getLevelProgress } from '../../utils/rewards';

const SIGNATURE_FEATURES = [
  {
    to: '/reverse-tutoring',
    title: 'Teach Leo & Maya',
    subtitle: 'Reverse Tutoring',
    desc: 'Become the teacher and explain big ideas in your own English words!',
    icon: MessageCircleQuestion,
    accent: 'bg-terracotta/15 text-terracotta',
  },
  {
    to: '/scanner',
    title: 'Object-to-Quest Scanner',
    subtitle: 'Live Camera Discovery',
    desc: 'Point your camera at leaves, spoons, or a messy desk for instant quests!',
    icon: Camera,
    accent: 'bg-sunbeam/30 text-[#9A6914]',
  },
  {
    to: '/voice-capsules',
    title: 'Family Voice Capsules',
    subtitle: 'Intergenerational Stories',
    desc: 'Interview a parent or grandparent and preserve an illustrated memory card.',
    icon: Mic,
    accent: 'bg-sage/30 text-espresso',
  },
  {
    to: '/sound-scavenger',
    title: 'Sound-Scavenger Lab',
    subtitle: 'Listening & Balloon Game',
    desc: 'Hunt real-world sounds and steer Maya’s hot-air balloon calmly!',
    icon: AudioLines,
    accent: 'bg-terracotta/15 text-terracotta',
  },
  {
    to: '/offline-missions',
    title: 'Offline Sun-Battery',
    subtitle: 'Screen-Free Missions',
    desc: 'Put the device down for 15–30 minutes to charge up real-world energy!',
    icon: Sun,
    accent: 'bg-sunbeam/30 text-[#9A6914]',
  },
  {
    to: '/habit-mirror',
    title: 'AR Habit Mirror',
    subtitle: 'Tidy Space Ecosystem',
    desc: 'Banish playful clutter sprites and grow your virtual nature room!',
    icon: HeartHandshake,
    accent: 'bg-sage/30 text-espresso',
  },
];

export function HomePage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const questProgress = usePhygitalStore((s) => s.questProgress);
  const parentQuests = usePhygitalStore((s) => s.parentQuests);
  const childBadges = usePhygitalStore((s) => s.childBadges);
  const companionAnimation = usePhygitalStore((s) => s.companionAnimation);
  const companionDialogue = usePhygitalStore((s) => s.companionDialogue);
  const prefer2D = usePhygitalStore((s) => s.prefer2DCompanions);
  const setCompanionState = usePhygitalStore((s) => s.setCompanionState);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  if (!activeChild) return null;

  const progress = getLevelProgress(activeChild.totalXp);
  const myProgress = questProgress.filter((q) => q.childId === activeChild.id);
  const myBadges = childBadges.filter((b) => b.childId === activeChild.id);
  const myAssigned = parentQuests.filter(
    (pq) => pq.childId === activeChild.id && pq.status === 'assigned'
  );
  const dailyHabitsDone = myProgress.filter(
    (q) => q.questZone === 'daily-hero-training'
  ).length;

  const recommendedQuest =
    QUEST_CATALOG.find((q) => !myProgress.some((p) => p.questTitle === q.title)) ??
    QUEST_CATALOG[0];

  const handleCompanionTap = (who: 'leo' | 'maya') => {
    if (who === 'leo') {
      setCompanionState('thinking', [
        {
          character: 'leo',
          emotion: 'curious',
          text: `Hey ${activeChild.nickname}! Wait—let me check my notes! Want to try "${recommendedQuest.title}" or teach me a science mystery?`,
        },
      ]);
    } else {
      setCompanionState('happy', [
        {
          character: 'maya',
          emotion: 'happy',
          text: `Come on, ${activeChild.nickname}! Every little discovery in the real world counts—let’s explore!`,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Greeting + 3D Stage */}
      <section className="grid lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/25 px-3 py-1 text-xs font-bold text-espresso">
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                {getAgeBandLabel(activeChild.ageGroup)} (Ages {activeChild.ageGroup})
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
                Hello, {activeChild.nickname}!
              </h1>
              <p className="text-sm sm:text-base font-semibold text-terracotta">
                Your next adventure starts in the real world!
              </p>
            </div>
          </div>

          <Companion3DStage
            animation={companionAnimation}
            sunBatteryLevel={activeChild.sunBatteryLevel}
            prefer2D={prefer2D}
            onSelectCompanion={handleCompanionTap}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <XpProgressBar {...progress} totalXp={activeChild.totalXp} />
            <SunBatteryMeter level={activeChild.sunBatteryLevel} />
          </div>

          <StorybookCard className="!p-4 space-y-3">
            <CompanionDialogueBox turns={companionDialogue} title="Live Companion Notes" />
          </StorybookCard>
        </div>
      </section>

      {/* Today's Recommended Adventure + Daily Habit + Parent Missions */}
      <section className="grid md:grid-cols-3 gap-4">
        <StorybookCard className="md:col-span-2 flex flex-col justify-between gap-4 bg-white">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-terracotta/15 px-3 py-1 text-xs font-bold text-terracotta">
              Today’s Recommended Adventure
            </span>
            <h2 className="text-xl font-extrabold text-espresso">{recommendedQuest.title}</h2>
            <p className="text-sm text-cocoa leading-relaxed">
              {recommendedQuest.promptByAge[activeChild.ageGroup]}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-espresso/10">
            <span className="text-xs font-bold text-cocoa">
              Est. {recommendedQuest.estimatedMinutes} min ·{' '}
              {recommendedQuest.requiresAdultAssistance
                ? 'Adult assistance recommended'
                : 'Independent real-world quest'}
            </span>
            <Link
              to={`/zones/${recommendedQuest.zoneId}`}
              className="tactile-btn bg-terracotta text-white px-4 py-2 text-sm shadow-tactile-terracotta hover:bg-[#b56d4e]"
            >
              Start Adventure
            </Link>
          </div>
        </StorybookCard>

        <StorybookCard className="flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-espresso">Daily Habit Progress</h2>
            <p className="text-sm text-cocoa">
              You have completed <strong className="text-espresso">{dailyHabitsDone}</strong>{' '}
              real-world hero habit(s) so far!
            </p>
            {myAssigned.length > 0 ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-terracotta">
                  From Your Parent ({myAssigned.length})
                </p>
                {myAssigned.slice(0, 2).map((pq) => (
                  <div
                    key={pq.id}
                    className="rounded-xl bg-white p-2.5 border border-espresso/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-espresso truncate">{pq.title}</p>
                      <p className="text-[11px] text-cocoa">+{pq.rewardXp} XP</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        completeQuest({
                          questZone: 'daily-hero-training',
                          questTitle: pq.title,
                          questType: 'habit',
                          aiEvaluationSummary: `Completed parent-assigned mission: ${pq.title}`,
                          parentQuestId: pq.id,
                        })
                      }
                      className="rounded-xl bg-sage/35 px-2.5 py-1 text-xs font-bold text-espresso hover:bg-sage/55 shrink-0"
                    >
                      Done!
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cocoa/80 italic">
                No extra parent tasks right now—explore any Adventure Zone!
              </p>
            )}
          </div>
          <Link
            to="/habit-mirror"
            className="tactile-btn bg-sage text-espresso px-4 py-2 text-sm shadow-tactile-sage hover:bg-[#95a589]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Open AR Habit Mirror
          </Link>
        </StorybookCard>
      </section>

      {/* Six Signature PHYGITAL Experiences */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-espresso">Signature Real-World Missions</h2>
          <span className="text-xs font-semibold text-cocoa">
            Speak, scan, listen &amp; unplug
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SIGNATURE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.to}
                to={feat.to}
                className="storybook-card p-5 bg-white hover:-translate-y-0.5 transition flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl ${feat.accent} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cocoa">
                      {feat.subtitle}
                    </p>
                    <h3 className="font-extrabold text-espresso group-hover:text-terracotta transition">
                      {feat.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-cocoa leading-relaxed">{feat.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Five Adventure Zone Shortcuts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-espresso">Five Adventure Zones</h2>
          <Link to="/zones" className="text-xs font-bold text-terracotta hover:underline">
            Explore all zones →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ADVENTURE_ZONES.map((zone) => (
            <Link
              key={zone.id}
              to={`/zones/${zone.id}`}
              className="rounded-2xl border border-espresso/10 bg-white p-4 shadow-sm hover:border-terracotta/50 transition space-y-2"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-terracotta shrink-0" />
                <span className="text-xs font-extrabold text-espresso">{zone.name}</span>
              </div>
              <p className="text-[11px] text-cocoa leading-snug">{zone.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Unlocked Badges */}
      <StorybookCard className="bg-white/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-extrabold text-espresso">Recently Unlocked Badges</h2>
          <Link to="/rewards" className="text-xs font-bold text-terracotta hover:underline">
            View My Rewards →
          </Link>
        </div>
        {myBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {myBadges.map((b) => (
              <BadgeChip key={b.badgeCode} name={b.badgeName} unlocked />
            ))}
          </div>
        ) : (
          <p className="text-sm text-cocoa">
            Complete your first quest in any Adventure Zone to unlock your first illustrated badge!
          </p>
        )}
      </StorybookCard>
    </div>
  );
}
