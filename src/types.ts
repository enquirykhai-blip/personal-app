export type TaskCategory = "personal" | "work" | "errand" | "other";
export type TaskPriority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
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

export interface Habit {
  id: string;
  name: string;
  cue?: string;
  identity?: string;
  createdAt: string;
  completions: string[];
}

export const PRAYERS = ["subuh", "zohor", "asar", "maghrib", "isyak"] as const;
export type PrayerName = (typeof PRAYERS)[number];
export type PrayerLog = Record<string, PrayerName[]>;
