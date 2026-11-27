import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import type { DialogueTurn } from '../../types/phygital';
import { speakInEnglish, stopSpeaking } from '../../services/speechService';

interface CompanionDialogueBoxProps {
  turns: DialogueTurn[];
  title?: string;
}

export function CompanionDialogueBox({ turns, title }: CompanionDialogueBoxProps) {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const handleSpeak = (idx: number, turn: DialogueTurn) => {
    if (speakingIndex === idx) {
      stopSpeaking();
      setSpeakingIndex(null);
      return;
    }
    setSpeakingIndex(idx);
    speakInEnglish(turn.text, turn.character);
    window.setTimeout(() => setSpeakingIndex(null), 4500);
  };

  return (
    <div className="space-y-2.5">
      {title && <p className="text-xs font-bold uppercase tracking-wider text-cocoa">{title}</p>}
      {turns.map((turn, idx) => {
        const isLeo = turn.character === 'leo';
        return (
          <div
            key={`${turn.character}-${idx}`}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-sm transition ${
              isLeo
                ? 'bg-white border-terracotta/25'
                : 'bg-[#F8FAF6] border-sage/45'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-sm ${
                isLeo ? 'bg-terracotta' : 'bg-[#6F8263]'
              }`}
            >
              {isLeo ? 'L' : 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-espresso">
                  {isLeo ? 'Leo (Inventor)' : 'Maya (Explorer)'} ·{' '}
                  <span className="capitalize font-medium text-cocoa">{turn.emotion}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak(idx, turn)}
                  className="inline-flex items-center gap-1 rounded-full bg-sandcard px-2.5 py-1 text-xs font-semibold text-espresso hover:bg-sunbeam/30 transition"
                  aria-label={`Listen to ${isLeo ? 'Leo' : 'Maya'} in English`}
                >
                  {speakingIndex === idx ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      Listen
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm sm:text-base leading-relaxed text-espresso">
                {turn.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
