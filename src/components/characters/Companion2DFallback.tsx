import { motion } from 'framer-motion';
import type { CompanionAnimation } from '../../types/phygital';

interface Companion2DFallbackProps {
  animation: CompanionAnimation;
  sunBatteryLevel: number;
  compact?: boolean;
  onSelectCompanion?: (who: 'leo' | 'maya') => void;
}

export function Companion2DFallback({
  animation,
  sunBatteryLevel,
  compact = false,
  onSelectCompanion,
}: Companion2DFallbackProps) {
  const isCelebrating = animation === 'celebration' || animation === 'happy';
  const isThinking = animation === 'thinking';
  const isSurprised = animation === 'surprised';

  return (
    <div
      className={`relative overflow-hidden rounded-storybook border border-espresso/10 bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E4] to-[#E9E4D5] ${
        compact ? 'h-48' : 'h-64 sm:h-72'
      } flex items-end justify-center px-4 pb-4 select-none`}
      aria-label="Leo and Maya 2D Storybook Stage"
    >
      {/* Sun-Battery glowing orb */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ repeat: Infinity, duration: 3.5 }}
        className="absolute top-4 right-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm border border-sunbeam/50"
      >
        <span
          className="h-3.5 w-3.5 rounded-full bg-sunbeam shadow-[0_0_10px_#E8C878]"
          aria-hidden="true"
        />
        <span className="text-xs font-bold text-espresso">Sun-Battery {sunBatteryLevel}%</span>
      </motion.div>

      {/* Soft rolling hill */}
      <div
        className="absolute bottom-0 inset-x-0 h-14 rounded-t-[100%] bg-sage/35 border-t border-sage/40"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-end justify-center gap-6 sm:gap-12">
        {/* LEO (2D SVG) */}
        <motion.button
          type="button"
          onClick={() => onSelectCompanion?.('leo')}
          animate={
            isCelebrating
              ? { y: [0, -14, 0], rotate: [0, -3, 3, 0] }
              : isThinking
                ? { rotate: [-2, 2, -2] }
                : { y: [0, -4, 0] }
          }
          transition={{ repeat: Infinity, duration: isCelebrating ? 0.9 : 2.8 }}
          className="group flex flex-col items-center focus:outline-none"
          title="Tap Leo for a science note"
        >
          <svg
            viewBox="0 0 120 140"
            className={compact ? 'w-24 h-28' : 'w-28 h-32 sm:w-32 sm:h-36'}
            aria-label="Leo the Young Inventor"
          >
            {/* Body / Explorer Vest */}
            <rect x="34" y="72" width="52" height="50" rx="18" fill="#C77B5A" />
            <rect x="44" y="74" width="32" height="46" rx="10" fill="#FAF8F5" />
            {/* Notebook */}
            <rect x="26" y="88" width="18" height="24" rx="4" fill="#E8C878" stroke="#4A3525" strokeWidth="2" />
            {/* Head */}
            <circle cx="60" cy="46" r="26" fill="#F6D5B8" />
            {/* Hair */}
            <path d="M34 42 C34 20, 86 20, 86 42 C78 30, 42 30, 34 42 Z" fill="#4A3525" />
            {/* Glasses */}
            <circle cx="49" cy="46" r="8" fill="#FFFFFF" stroke="#4A3525" strokeWidth="2.5" />
            <circle cx="71" cy="46" r="8" fill="#FFFFFF" stroke="#4A3525" strokeWidth="2.5" />
            <line x1="57" y1="46" x2="63" y2="46" stroke="#4A3525" strokeWidth="2.5" />
            <circle cx="50" cy="46" r="2.8" fill="#4A3525" />
            <circle cx="72" cy="46" r="2.8" fill="#4A3525" />
            {/* Mouth */}
            {isSurprised ? (
              <circle cx="60" cy="60" r="4.5" fill="#4A3525" />
            ) : (
              <path d="M52 58 Q60 65 68 58" fill="none" stroke="#4A3525" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {/* Glowing Magnifying Glass */}
            <circle cx="94" cy="84" r="10" fill="#E8C878" fillOpacity="0.65" stroke="#4A3525" strokeWidth="2.5" />
            <line x1="88" y1="92" x2="80" y2="105" stroke="#7A583E" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="mt-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-espresso shadow-sm">
            Leo
          </span>
        </motion.button>

        {/* MAYA (2D SVG) */}
        <motion.button
          type="button"
          onClick={() => onSelectCompanion?.('maya')}
          animate={
            isCelebrating
              ? { y: [0, -16, 0], rotate: [0, 3, -3, 0] }
              : { y: [0, -5, 0] }
          }
          transition={{ repeat: Infinity, duration: isCelebrating ? 0.85 : 2.5, delay: 0.25 }}
          className="group flex flex-col items-center focus:outline-none"
          title="Tap Maya for an adventure spark"
        >
          <svg
            viewBox="0 0 120 140"
            className={compact ? 'w-24 h-28' : 'w-28 h-32 sm:w-32 sm:h-36'}
            aria-label="Maya the Adventurous Explorer"
          >
            {/* Curly Hair Back */}
            <circle cx="38" cy="38" r="14" fill="#4A3525" />
            <circle cx="82" cy="38" r="14" fill="#4A3525" />
            <circle cx="60" cy="26" r="16" fill="#4A3525" />
            {/* Body / Sage Explorer Tunic */}
            <rect x="34" y="72" width="52" height="50" rx="18" fill="#A5B49A" />
            {/* Adventure Satchel Strap */}
            <line x1="40" y1="74" x2="80" y2="116" stroke="#C77B5A" strokeWidth="6" strokeLinecap="round" />
            <rect x="70" y="96" width="18" height="18" rx="5" fill="#C77B5A" />
            {/* Head */}
            <circle cx="60" cy="48" r="25" fill="#EAC09E" />
            {/* Curly Bangs */}
            <circle cx="44" cy="31" r="8" fill="#4A3525" />
            <circle cx="60" cy="27" r="9" fill="#4A3525" />
            <circle cx="76" cy="31" r="8" fill="#4A3525" />
            {/* Leaf Hair Clip */}
            <path d="M78 28 Q90 20 88 33 Q80 35 78 28 Z" fill="#A5B49A" stroke="#4A3525" strokeWidth="1.5" />
            {/* Eyes */}
            <circle cx="50" cy="48" r="3" fill="#4A3525" />
            <circle cx="70" cy="48" r="3" fill="#4A3525" />
            <circle cx="44" cy="54" r="3.5" fill="#C77B5A" fillOpacity="0.35" />
            <circle cx="76" cy="54" r="3.5" fill="#C77B5A" fillOpacity="0.35" />
            {/* Mouth */}
            <path d="M51 58 Q60 66 69 58" fill="none" stroke="#4A3525" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="mt-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-espresso shadow-sm">
            Maya
          </span>
        </motion.button>
      </div>
    </div>
  );
}
