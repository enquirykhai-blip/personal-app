import { createContext, useContext } from "react";
import type { PrayerLog, Profile, Task } from "./types";

export type SyncStatus = "off" | "connecting" | "synced" | "saving" | "error";

export interface AppData {
  tasks: Task[];
  prayers: PrayerLog;
  profile: Profile;
  setTasks: (update: (prev: Task[]) => Task[]) => void;
  setPrayers: (update: (prev: PrayerLog) => PrayerLog) => void;
  setProfile: (update: (prev: Profile) => Profile) => void;
  /** Replaces everything at once — used by settings import. */
  replaceAll: (data: { tasks: Task[]; prayers: PrayerLog; profile: Profile }) => void;
  sync: SyncStatus;
  isAnonymous: boolean;
  accountLabel: string | null;
  /** True once, on the very first launch with cloud sync configured, until the
      user picks Google sign-in or continues as a guest. */
  needsSignInChoice: boolean;
  completeSignInChoice: () => void;
}

export const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData mesti digunakan di dalam AppDataProvider");
  return ctx;
}
