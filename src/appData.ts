import { createContext, useContext } from "react";
import type { Habit, PrayerLog, Task } from "./types";

export type SyncStatus = "off" | "connecting" | "synced" | "saving" | "error";

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  prayers: PrayerLog;
  setTasks: (update: (prev: Task[]) => Task[]) => void;
  setHabits: (update: (prev: Habit[]) => Habit[]) => void;
  setPrayers: (update: (prev: PrayerLog) => PrayerLog) => void;
  sync: SyncStatus;
  isAnonymous: boolean;
  accountLabel: string | null;
}

export const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData mesti digunakan di dalam AppDataProvider");
  return ctx;
}
