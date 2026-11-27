import type { ReactNode } from 'react';
import { Award, ShieldAlert, Sparkles, Sun } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export function StorybookCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`storybook-card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function DevModeBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sunbeam/70 bg-sunbeam/20 px-4 py-2 text-xs text-espresso"
      role="status"
    >
      <div className="flex items-center gap-2 font-semibold">
        <ShieldAlert className="h-4 w-4 text-terracotta shrink-0" />
        <span>
          Development Sandbox Mode: Running with local browser storage &amp; simulated AI responses.
          Configure Supabase &amp; Gemini secrets for cloud production.
        </span>
      </div>
    </div>
  );
}

export function SunBatteryMeter({ level }: { level: number }) {
  const clamped = Math.min(100, Math.max(0, level));
  return (
    <div className="rounded-2xl bg-white/90 border border-sunbeam/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunbeam/35 text-espresso">
            <Sun className="h-5 w-5 text-[#B47D18]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa">
              Offline Sun-Battery
            </p>
            <p className="text-sm font-bold text-espresso">{clamped}% Charged</p>
          </div>
        </div>
        <span className="rounded-full bg-sage/25 px-2.5 py-1 text-xs font-semibold text-espresso">
          Screen-Free Power
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sandcard">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sunbeam to-terracotta transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function XpProgressBar({
  level,
  levelTitle,
  currentLevelXp,
  nextLevelThreshold,
  percent,
  totalXp,
}: {
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelThreshold: number;
  percent: number;
  totalXp: number;
}) {
  return (
    <div className="rounded-2xl bg-white/90 border border-terracotta/25 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa">
              Level {level} · {levelTitle}
            </p>
            <p className="text-sm font-bold text-espresso">{totalXp} Total XP</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-cocoa">
          {currentLevelXp}/{nextLevelThreshold} XP
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sandcard">
        <div
          className="h-full rounded-full bg-terracotta transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function BadgeChip({ name, unlocked }: { name: string; unlocked: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
        unlocked
          ? 'bg-sunbeam/30 border-sunbeam text-espresso'
          : 'bg-sandcard/60 border-espresso/10 text-cocoa/70'
      }`}
    >
      <Award className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}
