import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Habit } from "./types";
import { currentStreak, lastNDays, todayISO } from "./dateUtils";
import { atRiskOfMissingTwice } from "./statsUtils";
import MonthHeatmap from "./MonthHeatmap";

interface Draft {
  name: string;
  cue: string;
  identity: string;
}

const EMPTY_DRAFT: Draft = { name: "", cue: "", identity: "" };

export default function HabitsTab() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const days = lastNDays(7);
  const today = todayISO();

  function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      cue: draft.cue.trim() || undefined,
      identity: draft.identity.trim() || undefined,
      createdAt: new Date().toISOString(),
      completions: [],
    };
    setHabits((prev) => [...prev, habit]);
    setDraft(EMPTY_DRAFT);
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
    setEditDraft({ name: habit.name, cue: habit.cue ?? "", identity: habit.identity ?? "" });
  }

  function saveEdit(id: string) {
    const trimmed = editDraft.name.trim();
    if (!trimmed) return;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, name: trimmed, cue: editDraft.cue.trim() || undefined, identity: editDraft.identity.trim() || undefined }
          : h,
      ),
    );
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-black text-fg">Tabiat</h1>

      <form onSubmit={addHabit} className="mb-6 flex flex-col gap-2 rounded-3xl border border-line bg-panel p-4 shadow-card">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Tabiat baharu (contoh: Baca 20 minit)"
          className="rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-fg placeholder:text-muted outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={draft.cue}
            onChange={(e) => setDraft({ ...draft, cue: e.target.value })}
            placeholder="Selepas apa? (cth: Lepas gosok gigi pagi)"
            className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-fg placeholder:text-muted outline-none focus:border-accent"
          />
          <input
            value={draft.identity}
            onChange={(e) => setDraft({ ...draft, identity: e.target.value })}
            placeholder="Identiti (cth: Saya seorang pembaca)"
            className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-fg placeholder:text-muted outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="self-end rounded-full bg-dark px-5 py-2 text-sm font-bold uppercase tracking-wide text-dark-ink transition-transform duration-150 active:scale-95"
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
          const atRisk = atRiskOfMissingTwice(habit);
          return (
            <li
              key={habit.id}
              className={`animate-fade-in-up rounded-2xl border p-4 shadow-card ${
                atRisk ? "border-red-400/40 bg-red-400/5" : "border-line bg-panel"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                {editingId === habit.id ? (
                  <div className="flex w-full flex-col gap-2">
                    <input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      autoFocus
                      className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm text-fg outline-none focus:border-accent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={editDraft.cue}
                        onChange={(e) => setEditDraft({ ...editDraft, cue: e.target.value })}
                        placeholder="Selepas apa?"
                        className="flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent"
                      />
                      <input
                        value={editDraft.identity}
                        onChange={(e) => setEditDraft({ ...editDraft, identity: e.target.value })}
                        placeholder="Identiti"
                        className="flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs font-bold text-muted hover:text-fg"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => saveEdit(habit.id)}
                        className="rounded-full bg-dark px-3 py-1.5 text-xs font-bold uppercase text-dark-ink"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-sm font-black text-violet-600">
                        {habit.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-fg">{habit.name}</p>
                        {habit.identity && (
                          <p className="mt-0.5 text-xs font-semibold text-accent">✦ {habit.identity}</p>
                        )}
                        {habit.cue && <p className="mt-0.5 text-xs text-muted">🔗 {habit.cue}</p>}
                        <p className="mt-1 text-xs font-semibold text-muted">
                          {streak > 0 ? (
                            <span className="text-accent">🔥 {streak} hari berturut-turut</span>
                          ) : (
                            "Belum ada streak"
                          )}
                        </p>
                        {atRisk && (
                          <p className="mt-1 animate-shake text-xs font-bold text-red-600">
                            ⚠️ Jangan miss 2 hari berturut-turut!
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setExpandedId(expandedId === habit.id ? null : habit.id)}
                        className={`grid h-6 w-6 place-items-center rounded-full transition-transform duration-150 hover:bg-panel-2 active:scale-90 ${
                          expandedId === habit.id ? "text-accent" : "text-muted hover:text-fg"
                        }`}
                        aria-label="Lihat heatmap bulanan"
                      >
                        📅
                      </button>
                      <button
                        onClick={() => startEdit(habit)}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-fg active:scale-90"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="grid h-6 w-6 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-red-400 active:scale-90"
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
                      className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-bold transition-all duration-150 active:scale-90 ${
                        done
                          ? "bg-accent text-ink"
                          : "border border-line bg-panel-2 text-muted hover:border-accent/50 hover:text-fg"
                      } ${day === today ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : ""}`}
                    >
                      <span className="leading-none">{label}</span>
                      <span key={done ? "on" : "off"} className={`leading-none ${done ? "animate-pop" : ""}`}>
                        {done ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
              {expandedId === habit.id && (
                <div className="mt-3 animate-fade-in-up">
                  <MonthHeatmap
                    todayISO={today}
                    getIntensity={(dateISO) => (habit.completions.includes(dateISO) ? 1 : 0)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
