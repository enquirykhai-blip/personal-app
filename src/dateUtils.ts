export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
