import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Habit } from "./types";
import { currentStreak, lastNDays, todayISO } from "./dateUtils";

export default function HabitsTab() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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

  function startEdit(habit: Habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
  }

  function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, name: trimmed } : h)));
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={addHabit} className="mb-6 flex gap-2 rounded-2xl border border-line bg-panel p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tabiat baharu (contoh: Baca 20 minit)"
          className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold uppercase tracking-wide text-ink hover:brightness-110"
        >
          Tambah
        </button>
      </form>

      {habits.length === 0 && (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Belum ada tabiat lagi. Tambah satu di atas.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {habits.map((habit) => {
          const streak = currentStreak(habit.completions);
          return (
            <li key={habit.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-4 flex items-center justify-between">
                {editingId === habit.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm text-white outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs font-bold text-muted hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => saveEdit(habit.id)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold uppercase text-ink hover:brightness-110"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-white">{habit.name}</p>
                      <p className="text-xs font-semibold text-muted">
                        {streak > 0 ? (
                          <span className="text-accent">🔥 {streak} hari berturut-turut</span>
                        ) : (
                          "Belum ada streak"
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(habit)}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-white"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-red-400"
                        aria-label="Padam"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
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
                      className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-bold transition ${
                        done
                          ? "bg-accent text-ink"
                          : "border border-line bg-panel-2 text-muted hover:border-accent/50 hover:text-white"
                      } ${day === today ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : ""}`}
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
