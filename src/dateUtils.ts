export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function yesterdayISO(): string {
  return addDays(todayISO(), -1);
}

export function currentStreak(completions: string[]): number {
  const set = new Set(completions);
  let streak = 0;
  let cursor = todayISO();

  if (!set.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!set.has(cursor)) return 0;
  }

  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  let cursor = todayISO();
  for (let i = 0; i < n; i++) {
    days.unshift(cursor);
    cursor = addDays(cursor, -1);
  }
  return days;
}
