import { useState } from "react";
import { cx } from "./cx";
import { useLocalStorage } from "./useLocalStorage";
import type { Habit } from "./types";
import { currentStreak, lastNDays, todayISO } from "./dateUtils";
import { atRiskOfMissingTwice } from "./statsUtils";
import MonthHeatmap from "./MonthHeatmap";
import { IconCalendar, IconChevronDown, IconPencil, IconPlus, IconSliders, IconTrash } from "./icons";
import { Button, Card, EmptyState, IconButton, TextField } from "./ui";

interface Draft {
  name: string;
  cue: string;
  identity: string;
}

const EMPTY_DRAFT: Draft = { name: "", cue: "", identity: "" };

export default function HabitsTab() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showOptions, setShowOptions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const days = lastNDays(7);
  const today = todayISO();

  function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    setHabits((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        cue: draft.cue.trim() || undefined,
        identity: draft.identity.trim() || undefined,
        createdAt: new Date().toISOString(),
        completions: [],
      },
    ]);
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
          ? {
              ...h,
              name: trimmed,
              cue: editDraft.cue.trim() || undefined,
              identity: editDraft.identity.trim() || undefined,
            }
          : h,
      ),
    );
    setEditingId(null);
  }

  const doneToday = habits.filter((h) => h.completions.includes(today)).length;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="text-display text-ink">Tabiat</h1>
        <p className="mt-0.5 text-caption text-ink-3">
          {habits.length === 0 ? "Belum ada tabiat" : `${doneToday}/${habits.length} siap hari ini`}
        </p>
      </header>

      <Card className="mb-5 p-3">
        <form onSubmit={addHabit}>
          <div className="flex gap-2">
            <TextField
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Tabiat baharu, cth: Baca 20 minit"
              aria-label="Nama tabiat"
            />
            <Button type="submit" disabled={!draft.name.trim()} className="px-4">
              <IconPlus className="h-5 w-5" />
              <span className="sr-only">Tambah tabiat</span>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            aria-expanded={showOptions}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-caption font-semibold text-ink-3 transition-colors hover:text-ink"
          >
            <IconSliders className="h-4 w-4" />
            Pemicu &amp; identiti
            <IconChevronDown className={cx("h-3.5 w-3.5 transition-transform", showOptions && "rotate-180")} />
          </button>

          {showOptions && (
            <div className="mt-1 grid animate-rise gap-2">
              <TextField
                value={draft.cue}
                onChange={(e) => setDraft({ ...draft, cue: e.target.value })}
                placeholder="Selepas apa? cth: Lepas gosok gigi pagi"
                aria-label="Pemicu"
                className="h-10 text-label"
              />
              <TextField
                value={draft.identity}
                onChange={(e) => setDraft({ ...draft, identity: e.target.value })}
                placeholder="Identiti, cth: Saya seorang pembaca"
                aria-label="Identiti"
                className="h-10 text-label"
              />
            </div>
          )}
        </form>
      </Card>

      {habits.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="Mulakan satu tabiat kecil"
          hint="Kaitkan dengan sesuatu yang awak dah buat setiap hari — lagi mudah untuk melekat."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => {
            const streak = currentStreak(habit.completions);
            const atRisk = atRiskOfMissingTwice(habit);
            const isEditing = editingId === habit.id;
            const isExpanded = expandedId === habit.id;

            return (
              <li key={habit.id}>
                <Card className={cx("animate-rise p-3", atRisk && "border-danger/30")}>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <TextField
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        aria-label="Nama tabiat"
                        autoFocus
                      />
                      <TextField
                        value={editDraft.cue}
                        onChange={(e) => setEditDraft({ ...editDraft, cue: e.target.value })}
                        placeholder="Pemicu"
                        aria-label="Pemicu"
                        className="h-10 text-label"
                      />
                      <TextField
                        value={editDraft.identity}
                        onChange={(e) => setEditDraft({ ...editDraft, identity: e.target.value })}
                        placeholder="Identiti"
                        aria-label="Identiti"
                        className="h-10 text-label"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          Batal
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(habit.id)}>
                          Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-subtitle text-ink">{habit.name}</p>
                          {habit.identity && (
                            <p className="mt-0.5 text-caption font-semibold text-brand">✦ {habit.identity}</p>
                          )}
                          {habit.cue && <p className="mt-0.5 text-caption text-ink-3">↳ {habit.cue}</p>}
                          <p className="mt-1 text-caption text-ink-2">
                            {streak > 0 ? `🔥 ${streak} hari berturut-turut` : "Belum bermula"}
                          </p>
                          {atRisk && (
                            <p className="mt-1 animate-nudge text-caption font-semibold text-danger">
                              Jangan terlepas dua hari berturut-turut
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0">
                          <IconButton
                            label="Lihat heatmap bulanan"
                            onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                            className={cx(isExpanded && "bg-brand-soft text-brand")}
                          >
                            <IconCalendar className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Edit tabiat" onClick={() => startEdit(habit)}>
                            <IconPencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Padam tabiat" danger onClick={() => deleteHabit(habit.id)}>
                            <IconTrash className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-1.5">
                        {days.map((day) => {
                          const done = habit.completions.includes(day);
                          const isToday = day === today;
                          const d = new Date(day + "T00:00:00");
                          const wd = d.toLocaleDateString("ms-MY", { weekday: "narrow" });
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(habit.id, day)}
                              aria-pressed={done}
                              aria-label={`${habit.name} pada ${d.toLocaleDateString("ms-MY", { day: "numeric", month: "long" })}`}
                              className={cx(
                                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-field border text-caption font-semibold",
                                "transition-[background-color,border-color,transform] duration-150 active:scale-90",
                                done
                                  ? "border-brand bg-brand text-white"
                                  : "border-border bg-surface-2 text-ink-3 hover:border-brand-vivid",
                                isToday && !done && "border-brand-vivid ring-2 ring-brand/15",
                              )}
                            >
                              <span className="leading-none opacity-80">{wd}</span>
                              <span className="text-[0.8125rem] leading-none tabular-nums">{d.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 animate-rise">
                          <MonthHeatmap
                            todayISO={today}
                            getIntensity={(iso) => (habit.completions.includes(iso) ? 1 : 0)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
