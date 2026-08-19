import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconCheck } from "./icons";
import { playCelebrationFanfare } from "./sound";

/* Emoji carry the app's only colour by design (see README) — confetti is
   built from them instead of coloured shapes, so the palette stays honest. */
const CONFETTI = ["🎉", "✨", "⭐", "🎊", "🔥", "👏"];
const PIECE_COUNT = 22;

export default function SuccessCelebration({ taskText, onDone }: { taskText: string; onDone: () => void }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 300) / 1000,
        duration: 1.1 + Math.round(Math.random() * 600) / 1000,
        drift: Math.round((Math.random() - 0.5) * 120),
        size: 1.1 + Math.random() * 0.9,
      })),
    [],
  );

  useEffect(() => {
    playCelebrationFanfare();
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 overflow-hidden bg-ink/95 px-6 text-center"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 select-none"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}rem`,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s both`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}

      <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-white text-ink">
        <IconCheck className="h-10 w-10" />
      </span>
      <div className="animate-rise">
        <p className="text-display font-black text-white">Tugasan siap!</p>
        <p className="mx-auto mt-1 max-w-xs truncate text-label text-white/70">{taskText}</p>
      </div>
    </div>,
    document.body,
  );
}
