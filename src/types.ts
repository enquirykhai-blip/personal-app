export type TaskCategory = "personal" | "work" | "errand" | "other";
export type TaskPriority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  /** Set by AI-generated steps; manual steps leave these empty. */
  emoji?: string;
  minutes?: number;
}

export interface Profile {
  name?: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  subtasks?: Subtask[];
}

export const PRAYERS = ["subuh", "zohor", "asar", "maghrib", "isyak"] as const;
export type PrayerName = (typeof PRAYERS)[number];
export type PrayerLog = Record<string, PrayerName[]>;
