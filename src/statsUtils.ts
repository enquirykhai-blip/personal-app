import type { Habit, Task, TaskPriority } from "./types";
import { currentStreak, todayISO, yesterdayISO } from "./dateUtils";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHT[a.priority ?? "medium"] - PRIORITY_WEIGHT[b.priority ?? "medium"];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function isOverdue(task: Task): boolean {
  return !task.done && !!task.dueDate && task.dueDate < todayISO();
}

export function isDueToday(task: Task): boolean {
  return task.dueDate === todayISO();
}

export function longestCurrentStreak(habits: Habit[]): number {
  return habits.reduce((max, h) => Math.max(max, currentStreak(h.completions)), 0);
}

export function habitsDoneToday(habits: Habit[]): number {
  const today = todayISO();
  return habits.filter((h) => h.completions.includes(today)).length;
}

/** True when the habit was skipped yesterday and still isn't done today — the "never miss twice" nudge. */
export function atRiskOfMissingTwice(habit: Habit): boolean {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const existedYesterday = habit.createdAt.slice(0, 10) <= yesterday;
  if (!existedYesterday) return false;
  return !habit.completions.includes(yesterday) && !habit.completions.includes(today);
}
