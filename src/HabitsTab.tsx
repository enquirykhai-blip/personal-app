import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Habit } from "./types";
import { currentStreak, lastNDays, todayISO } from "./dateUtils";

export default function HabitsTab() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [name, setName] = useState("");
  const days = lastNDays(7);
  const today = todayISO();

  function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      completions: [],
    };
    setHabits((prev) => [...prev, habit]);
    setName("");
  }

  function toggleDay(id: string, day: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const has = h.completions.includes(day);
        return {
          ...h,
          completions: has ? h.completions.filter((d) => d !== day) : [...h.completions, day],
        };
      }),
    );
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={addHabit} className="mb-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tabiat baharu (contoh: Baca 20 minit)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Tambah
        </button>
      </form>

      {habits.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
          Belum ada tabiat lagi. Tambah satu di atas.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {habits.map((habit) => {
          const streak = currentStreak(habit.completions);
          return (
            <li
              key={habit.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{habit.name}</p>
                  <p className="text-xs text-slate-400">
                    {streak > 0 ? `🔥 ${streak} hari berturut-turut` : "Belum ada streak"}
                  </p>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Padam"
                >
                  ✕
                </button>
              </div>
              <div className="flex justify-between gap-1">
                {days.map((day) => {
                  const done = habit.completions.includes(day);
                  const label = new Date(day + "T00:00:00").toLocaleDateString("ms-MY", { weekday: "narrow" });
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(habit.id, day)}
                      title={day}
                      className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs transition ${
                        done
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                      } ${day === today ? "ring-2 ring-violet-400" : ""}`}
                    >
                      <span className="leading-none">{label}</span>
                      <span className="leading-none">{done ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
