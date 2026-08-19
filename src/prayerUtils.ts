import { PRAYERS, type PrayerLog, type PrayerName } from "./types";
import { addDays, todayISO } from "./dateUtils";

export const PRAYER_LABELS: Record<PrayerName, string> = {
  subuh: "Subuh",
  zohor: "Zohor",
  asar: "Asar",
  maghrib: "Maghrib",
  isyak: "Isyak",
};

export const PRAYER_ICONS: Record<PrayerName, string> = {
  subuh: "🌅",
  zohor: "☀️",
  asar: "🌇",
  maghrib: "🌆",
  isyak: "🌙",
};

function isFullDay(log: PrayerLog, day: string): boolean {
  return (log[day]?.length ?? 0) === PRAYERS.length;
}

export function prayerStreak(log: PrayerLog): number {
  let streak = 0;
  let cursor = todayISO();

  if (!isFullDay(log, cursor)) {
    cursor = addDays(cursor, -1);
    if (!isFullDay(log, cursor)) return 0;
  }

  while (isFullDay(log, cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function togglePrayer(log: PrayerLog, day: string, prayer: PrayerName): PrayerLog {
  const done = log[day] ?? [];
  const next = done.includes(prayer) ? done.filter((p) => p !== prayer) : [...done, prayer];
  return { ...log, [day]: next };
}
