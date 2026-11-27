import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Award,
  Camera,
  Compass,
  Home,
  Lock,
  Sparkles,
  Sun,
} from 'lucide-react';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import { getAgeBandLabel } from '../../utils/rewards';
import { DevModeBanner } from '../common/StorybookUI';

const NAV_ITEMS = [
  { to: '/', label: 'Home', shortLabel: 'Home', icon: Home },
  { to: '/zones', label: 'Adventure Zones', shortLabel: 'Zones', icon: Compass },
  { to: '/scanner', label: 'Quest Scanner', shortLabel: 'Scanner', icon: Camera },
  { to: '/rewards', label: 'My Rewards', shortLabel: 'Rewards', icon: Award },
  { to: '/parent', label: 'Parent Dashboard', shortLabel: 'Parent', icon: Lock },
];

export function AppShell() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const prefer2D = usePhygitalStore((s) => s.prefer2DCompanions);
  const setPrefer2D = usePhygitalStore((s) => s.setPrefer2DCompanions);
  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0] ?? null;

  return (
    <div className="min-h-screen storybook-paper flex flex-col overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-espresso/10 bg-parchment/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-terracotta text-white shadow-tactile-terracotta">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-base sm:text-lg font-extrabold tracking-tight text-espresso leading-none">
                PHYGITAL
              </span>
              <span className="hidden xl:block text-[11px] font-semibold text-cocoa">
                Real-World Learning Adventure
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary Navigation">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs xl:text-sm font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-terracotta text-white shadow-sm'
                      : 'text-espresso hover:bg-sandcard'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Active Explorer Pill + 2D/3D Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setPrefer2D(!prefer2D)}
              className="inline-flex items-center gap-1 rounded-full border border-espresso/15 bg-white px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-cocoa hover:bg-sandcard transition whitespace-nowrap"
              title="Toggle 3D or 2D Storybook companion mode"
            >
              {prefer2D ? '3D Mode' : '2D Mode'}
            </button>
            {activeChild && (
              <Link
                to="/offline-missions"
                className="inline-flex items-center gap-1.5 rounded-full border border-sunbeam/70 bg-sunbeam/25 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-espresso hover:bg-sunbeam/40 transition whitespace-nowrap"
                title="Open Offline Sun-Battery"
              >
                <Sun className="h-3.5 w-3.5 text-[#B47D18] shrink-0" />
                <span className="max-w-[72px] sm:max-w-none truncate">{activeChild.nickname}</span>
                <span className="hidden xl:inline text-cocoa">
                  · {getAgeBandLabel(activeChild.ageGroup)}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 sm:px-4 py-5 sm:py-6 pb-24 lg:pb-10 space-y-5">
        <DevModeBanner />
        <Outlet />
      </main>

      {/* Mobile & Tablet Bottom Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t border-espresso/10 bg-parchment/95 backdrop-blur-md lg:hidden"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 px-1 py-1.5">
          {NAV_ITEMS.map(({ to, shortLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold transition ${
                  isActive ? 'text-terracotta bg-terracotta/10' : 'text-cocoa'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{shortLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
