import { Award, BookOpen, Lock, Sparkles, Sprout } from 'lucide-react';
import { StorybookCard, XpProgressBar } from '../../components/common/StorybookUI';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import { BADGE_CATALOG, getLevelProgress } from '../../utils/rewards';

export function RewardsPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const childBadges = usePhygitalStore((s) => s.childBadges);
  const memoryCards = usePhygitalStore((s) => s.memoryCards);
  const ecosystemByChild = usePhygitalStore((s) => s.ecosystemByChild);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  if (!activeChild) return null;

  const progress = getLevelProgress(activeChild.totalXp);
  const unlockedCodes = new Set(
    childBadges.filter((b) => b.childId === activeChild.id).map((b) => b.badgeCode)
  );
  const myMemories = memoryCards.filter((m) => m.childId === activeChild.id);
  const ecosystem = ecosystemByChild[activeChild.id] ?? {
    sprouts: 2,
    butterflies: 1,
    flowers: 1,
    tidyScore: 20,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso">My Rewards &amp; Keepsakes</h1>
        <p className="text-sm text-cocoa">
          Every badge celebrates curiosity, kindness, English storytelling, and screen-free action!
        </p>
      </div>

      <XpProgressBar {...progress} totalXp={activeChild.totalXp} />

      {/* Virtual Habit Ecosystem */}
      <StorybookCard className="bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/30 text-espresso">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-espresso">Growing Room Ecosystem</h2>
            <p className="text-xs text-cocoa">
              Daily Hero habits transform your virtual room into a thriving nature sanctuary!
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-center">
          <div className="rounded-2xl bg-parchment px-4 py-2 border border-espresso/10">
            <p className="text-lg font-extrabold text-espresso">{ecosystem.sprouts}</p>
            <p className="text-[11px] font-bold text-cocoa">Sprouts</p>
          </div>
          <div className="rounded-2xl bg-parchment px-4 py-2 border border-espresso/10">
            <p className="text-lg font-extrabold text-espresso">{ecosystem.flowers}</p>
            <p className="text-[11px] font-bold text-cocoa">Blooms</p>
          </div>
          <div className="rounded-2xl bg-parchment px-4 py-2 border border-espresso/10">
            <p className="text-lg font-extrabold text-espresso">{ecosystem.butterflies}</p>
            <p className="text-[11px] font-bold text-cocoa">Butterflies</p>
          </div>
        </div>
      </StorybookCard>

      {/* Illustrated Badges Grid */}
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold text-espresso">
          Explorer Badges ({unlockedCodes.size}/{BADGE_CATALOG.length})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BADGE_CATALOG.map((badge) => {
            const isUnlocked = unlockedCodes.has(badge.badgeCode);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4 transition flex flex-col justify-between gap-2 ${
                  isUnlocked
                    ? 'bg-white border-sunbeam shadow-sm'
                    : 'bg-sandcard/50 border-espresso/10 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: isUnlocked ? badge.accentColor : '#9E9389' }}
                  >
                    {isUnlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  {isUnlocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sunbeam/30 px-2 py-0.5 text-[10px] font-bold text-espresso">
                      <Sparkles className="h-3 w-3" />
                      Unlocked
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-espresso">{badge.badgeName}</h3>
                  <p className="text-xs text-cocoa mt-0.5 leading-snug">{badge.description}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
                  {badge.zoneHint}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Family Memory Cards */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-terracotta" />
          <h2 className="text-xl font-extrabold text-espresso">Family Memory Cards</h2>
        </div>
        {myMemories.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {myMemories.map((card) => (
              <StorybookCard key={card.id} className="bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sunbeam/30 px-3 py-0.5 text-xs font-bold text-espresso">
                    {card.familyMemberRole}
                  </span>
                  <span className="text-xs text-cocoa">
                    {new Date(card.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-extrabold text-espresso">{card.promptTitle}</h3>
                <p className="text-sm text-espresso leading-relaxed">{card.storySummary}</p>
                <p className="text-xs text-cocoa italic">{card.memoryCardDescription}</p>
              </StorybookCard>
            ))}
          </div>
        ) : (
          <StorybookCard className="bg-white/75 text-sm text-cocoa">
            Record or write a family story in <strong>Voice Capsules</strong> to collect your first
            illustrated Memory Card!
          </StorybookCard>
        )}
      </section>
    </div>
  );
}
