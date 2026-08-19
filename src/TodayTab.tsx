import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Habit, Task } from "./types";
import { currentStreak, todayISO } from "./dateUtils";
import { habitsDoneToday, isDueToday, isOverdue, longestCurrentStreak, sortTasks } from "./statsUtils";

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-400/15 text-red-300",
  medium: "bg-amber-400/15 text-amber-300",
  low: "bg-zinc-400/15 text-zinc-300",
};

export default function TodayTab() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const today = todayISO();

  const focusTasks = useMemo(
    () => sortTasks(tasks.filter((t) => !t.done && (isDueToday(t) || isOverdue(t)))),
    [tasks],
  );

  const pendingHabits = useMemo(() => habits.filter((h) => !h.completions.includes(today)), [habits, today]);

  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const bestStreak = longestCurrentStreak(habits);
  const habitsToday = habitsDoneToday(habits);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function markHabitDone(id: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completions: [...h.completions, today] } : h)),
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-panel p-3 text-center">
          <p className="text-2xl font-black text-white">
            {doneCount}/{totalCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">Tugasan siap</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3 text-center">
          <p className="text-2xl font-black text-accent">{bestStreak}</p>
          <p className="mt-1 text-xs font-semibold text-muted">Streak terpanjang</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3 text-center">
          <p className="text-2xl font-black text-white">
            {habitsToday}/{habits.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">Tabiat hari ini</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tugasan Mendesak</h2>
        {focusTasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Tiada tugasan mendesak. Bagus! 🎉
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {focusTasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                    overdue ? "border-red-400/40 bg-red-400/5" : "border-line bg-panel"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{task.text}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_COLOR[task.priority ?? "medium"]}`}>
                        {task.priority === "high" ? "Tinggi" : task.priority === "low" ? "Rendah" : "Sederhana"}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? "font-bold text-red-300" : "text-muted"}`}>
                          {overdue ? "Tertunggak" : "Due hari ini"}: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tabiat Belum Siap</h2>
        {pendingHabits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {habits.length === 0 ? "Belum ada tabiat lagi." : "Semua tabiat siap hari ini. Mantap! 🔥"}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendingHabits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel p-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{habit.name}</p>
                  <p className="text-xs text-muted">
                    {currentStreak(habit.completions) > 0
                      ? `🔥 ${currentStreak(habit.completions)} hari berturut-turut`
                      : "Belum ada streak"}
                  </p>
                </div>
                <button
                  onClick={() => markHabitDone(habit.id)}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink hover:brightness-110"
                >
                  Tandakan siap
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
