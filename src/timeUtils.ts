/** Minutes assumed for a step that has no AI/user time estimate. */
export const DEFAULT_TIMER_MINUTES = 5;

/** "45 min" / "1j 30m" — short enough for a badge. */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}j ${m}m` : `${h} jam`;
}

/** "4:05" — a running clock, always mm:ss regardless of length. */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
