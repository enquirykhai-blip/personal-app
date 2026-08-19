import { useMemo } from "react";
import { cx } from "./cx";
import { useAppData } from "./appData";
import { celebrateTaskDone } from "./celebrate";

import { PRAYERS, type Task } from "./types";
import { currentStreak, todayISO } from "./dateUtils";
import {
  atRiskOfMissingTwice,
  habitsDoneToday,
  isDueToday,
  isOverdue,
  sortTasks,
  subtaskProgress,
} from "./statsUtils";
import { PRAYER_LABELS, togglePrayer } from "./prayerUtils";
import type { Tab } from "./App";
import { IconList, IconMoon, IconPlus, IconRepeat, IconTarget } from "./icons";
import { Button, Card, Checkbox, Chip, EmptyState, PriorityMark, ProgressRing, SectionHeader } from "./ui";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 15) return "Selamat tengah hari";
  if (h < 19) return "Selamat petang";
  return "Selamat malam";
}

function priorityLabel(p: Task["priority"]) {
  return p === "high" ? "Tinggi" : p === "low" ? "Rendah" : "Sederhana";
}

export default function TodayTab({ onNavigate }: { onNavigate: (tab: Tab, taskId?: string) => void }) {
  const { tasks, setTasks, habits, setHabits, prayers: prayerLog, setPrayers: setPrayerLog, profile } =
    useAppData();
  const today = todayISO();

  const openTasks = useMemo(() => sortTasks(tasks.filter((t) => !t.done)), [tasks]);

  /* The single next action: soonest-due, highest-priority open task. */
  const focusTask = useMemo(() => {
    const urgent = openTasks.filter((t) => isDueToday(t) || isOverdue(t));
    return urgent[0] ?? openTasks[0] ?? null;
  }, [openTasks]);

  const pendingHabits = useMemo(
    () => habits.filter((h) => !h.completions.includes(today)),
    [habits, today],
  );

  const todayPrayers = prayerLog[today] ?? [];
  const pendingPrayers = PRAYERS.filter((p) => !todayPrayers.includes(p));

  const doneToday = tasks.filter((t) => t.done).length;
  const habitsToday = habitsDoneToday(habits);

  function toggleTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.done) celebrateTaskDone(task.text);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function markHabitDone(id: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completions: [...h.completions, today] } : h)),
    );
  }

  function markPrayerDone(prayer: (typeof PRAYERS)[number]) {
    setPrayerLog((prev) => togglePrayer(prev, today, prayer));
  }

  const dateLabel = new Date().toLocaleDateString("ms-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const summary = [
    {
      tab: "todo" as Tab,
      label: "Tugasan",
      icon: IconList,
      value: doneToday,
      total: tasks.length,
    },
    {
      tab: "habits" as Tab,
      label: "Tabiat",
      icon: IconRepeat,
      value: habitsToday,
      total: habits.length,
    },
    {
      tab: "solat" as Tab,
      label: "Solat",
      icon: IconMoon,
      value: todayPrayers.length,
      total: PRAYERS.length,
    },
  ];

  const focusProgress = focusTask ? subtaskProgress(focusTask) : null;
  const focusMinutes = (focusTask?.subtasks ?? []).reduce((n, st) => n + (st.minutes ?? 0), 0);

  const initials = (profile.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "MS";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-medium text-ink-3">{dateLabel}</p>
          <h1 className="mt-0.5 text-display text-ink">
            {greeting()}
            {profile.name ? `, ${profile.name}` : ""}
          </h1>
        </div>
        <button
          onClick={() => onNavigate("settings")}
          aria-label="Buka tetapan"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink bg-ink text-label font-bold text-white transition-transform active:scale-95"
        >
          {initials}
        </button>
      </header>

      {/* Focus — the one thing to do next */}
      <section className="mb-7">
        <SectionHeader title="Fokus sekarang" />
        {focusTask ? (
          <Card className="animate-rise overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <IconTarget className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-title text-ink">{focusTask.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Chip>
                    <PriorityMark level={focusTask.priority ?? "medium"} />
                    {priorityLabel(focusTask.priority)}
                  </Chip>
                  {isOverdue(focusTask) && <Chip tone="strong">Tertunggak</Chip>}
                  {isDueToday(focusTask) && <Chip>Perlu siap hari ini</Chip>}
                  {focusProgress && focusProgress.total > 0 && (
                    <Chip>
                      {focusProgress.done}/{focusProgress.total} langkah
                    </Chip>
                  )}
                  {focusMinutes > 0 && <Chip>~{focusMinutes} min</Chip>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border bg-surface-2/60 p-3">
              <Button variant="brand" className="flex-1" onClick={() => toggleTask(focusTask.id)}>
                Tandakan siap
              </Button>
              <Button variant="secondary" onClick={() => onNavigate("todo", focusTask.id)}>
                Pecahkan
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={tasks.length === 0 ? "🌱" : "🎉"}
            title={tasks.length === 0 ? "Belum ada tugasan" : "Semua tugasan selesai"}
            hint={
              tasks.length === 0
                ? "Tambah satu perkara kecil untuk dimulakan hari ini."
                : "Rehat sekejap — awak dah habiskan semuanya."
            }
            action={
              tasks.length === 0 && (
                <Button size="sm" onClick={() => onNavigate("todo")}>
                  Tambah tugasan
                </Button>
              )
            }
          />
        )}
      </section>

      {/* Progress summary — informs and navigates (replaces duplicate nav tiles) */}
      <section className="mb-7">
        <SectionHeader title="Kemajuan hari ini" />
        <div className="grid grid-cols-3 gap-2.5">
          {summary.map((s) => {
            const Icon = s.icon;
            const complete = s.total > 0 && s.value === s.total;
            return (
              <button
                key={s.tab}
                onClick={() => onNavigate(s.tab)}
                className={cx(
                  "flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-3.5",
                  "shadow-e1 transition-transform duration-150 active:scale-[0.97]",
                )}
              >
                <ProgressRing value={s.value} total={s.total}>
                  <span className={complete ? "text-brand" : "text-ink-3"} aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                </ProgressRing>
                <div className="text-center">
                  <p className="text-caption font-semibold text-ink">{s.label}</p>
                  <p className="text-[0.6875rem] font-medium tabular-nums text-ink-3">
                    {s.value}/{s.total}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Prayers */}
      <section className="mb-7">
        <SectionHeader
          title="Solat"
          action={
            <span className="text-caption tabular-nums text-ink-3">
              {todayPrayers.length}/{PRAYERS.length}
            </span>
          }
        />
        {pendingPrayers.length === 0 ? (
          <div className="rounded-card border border-brand/25 bg-brand-soft px-4 py-3.5 text-center">
            <p className="text-label font-semibold text-brand">Lima waktu lengkap hari ini 🤲</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingPrayers.map((p) => (
              <button
                key={p}
                onClick={() => markPrayerDone(p)}
                className={cx(
                  "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4",
                  "text-label font-semibold text-ink shadow-e1",
                  "transition-[border-color,transform] duration-150 hover:border-brand active:scale-95",
                )}
              >
                <IconPlus className="h-4 w-4 text-ink-3" />
                {PRAYER_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Habits */}
      <section>
        <SectionHeader
          title="Tabiat"
          action={
            <span className="text-caption tabular-nums text-ink-3">
              {habitsToday}/{habits.length}
            </span>
          }
        />
        {pendingHabits.length === 0 ? (
          habits.length === 0 ? (
            <EmptyState
              icon="🔁"
              title="Belum ada tabiat"
              hint="Mulakan dengan satu tabiat kecil yang boleh diulang setiap hari."
              action={
                <Button size="sm" onClick={() => onNavigate("habits")}>
                  Tambah tabiat
                </Button>
              }
            />
          ) : (
            <div className="rounded-card border border-brand/25 bg-brand-soft px-4 py-3.5 text-center">
              <p className="text-label font-semibold text-brand">Semua tabiat siap hari ini 🔥</p>
            </div>
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {pendingHabits.map((habit) => {
              const streak = currentStreak(habit.completions);
              const atRisk = atRiskOfMissingTwice(habit);
              return (
                <li key={habit.id} className="animate-rise">
                  <Card className={cx("flex items-center gap-2 p-2.5", atRisk && "border-danger/30 bg-danger-soft")}>
                    <Checkbox
                      checked={false}
                      onChange={() => markHabitDone(habit.id)}
                      label={`Tandakan ${habit.name} siap`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label font-semibold text-ink">{habit.name}</p>
                      <p className="text-caption text-ink-3">
                        {atRisk ? (
                          <span className="font-semibold text-danger">Jangan terlepas dua hari berturut-turut</span>
                        ) : streak > 0 ? (
                          `🔥 ${streak} hari berturut-turut`
                        ) : (
                          "Belum bermula"
                        )}
                      </p>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
