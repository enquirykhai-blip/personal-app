import type { Task, TaskPriority } from "./types";
import { todayISO } from "./dateUtils";

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

export function subtaskProgress(task: Task): { done: number; total: number } {
  const subtasks = task.subtasks ?? [];
  return { done: subtasks.filter((s) => s.done).length, total: subtasks.length };
}
