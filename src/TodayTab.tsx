import { useMemo, useState, type ReactElement } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { PRAYERS, type Habit, type PrayerLog, type Task } from "./types";
import { currentStreak, todayISO } from "./dateUtils";
import { atRiskOfMissingTwice, habitsDoneToday, isDueToday, isOverdue, longestCurrentStreak, sortTasks } from "./statsUtils";
import { PRAYER_ICONS, PRAYER_LABELS, togglePrayer } from "./prayerUtils";
import { IconBell, IconList, IconMoon, IconPin, IconRepeat, IconSearch } from "./icons";

type Tab = "today" | "todo" | "habits" | "solat";

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-zinc-100 text-zinc-600",
};

const CATEGORY_TILES: { tab: Tab; label: string; icon: (p: { className?: string }) => ReactElement; bg: string; fg: string }[] = [
  { tab: "todo", label: "Tugasan", icon: IconList, bg: "bg-sky-50", fg: "text-sky-600" },
  { tab: "habits", label: "Tabiat", icon: IconRepeat, bg: "bg-violet-50", fg: "text-violet-600" },
  { tab: "solat", label: "Solat", icon: IconMoon, bg: "bg-amber-50", fg: "text-amber-600" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 15) return "Selamat tengahari";
  if (h < 19) return "Selamat petang";
  return "Selamat malam";
}

export default function TodayTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [prayerLog, setPrayerLog] = useLocalStorage<PrayerLog>("prayers", {});
  const [search, setSearch] = useState("");
  const today = todayISO();

  const focusTasks = useMemo(
    () => sortTasks(tasks.filter((t) => !t.done && (isDueToday(t) || isOverdue(t)))),
    [tasks],
  );
  const visibleFocusTasks = useMemo(
    () => focusTasks.filter((t) => t.text.toLowerCase().includes(search.toLowerCase())),
    [focusTasks, search],
  );

  const pendingHabits = useMemo(() => habits.filter((h) => !h.completions.includes(today)), [habits, today]);
  const visiblePendingHabits = useMemo(
    () => pendingHabits.filter((h) => h.name.toLowerCase().includes(search.toLowerCase())),
    [pendingHabits, search],
  );

  const todayPrayers = prayerLog[today] ?? [];
  const pendingPrayers = PRAYERS.filter((p) => !todayPrayers.includes(p));

  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const bestStreak = longestCurrentStreak(habits);
  const habitsToday = habitsDoneToday(habits);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function markHabitDone(id: string) {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completions: [...h.completions, today] } : h)));
  }

  function markPrayerDone(prayer: (typeof PRAYERS)[number]) {
    setPrayerLog((prev) => togglePrayer(prev, today, prayer));
  }

  const dateLabel = new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-fg">{greeting()}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <IconPin className="h-4 w-4 text-accent" />
            {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel text-fg shadow-card">
            <IconBell className="h-5 w-5" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-black text-ink shadow-card">
            MS
          </div>
        </div>
      </div>

      <div className="relative mb-5">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tugasan atau tabiat"
          className="w-full rounded-full border border-line bg-panel py-3 pl-11 pr-4 text-sm text-fg shadow-card outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {CATEGORY_TILES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.tab}
              onClick={() => onNavigate(c.tab)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel p-4 shadow-card transition-transform duration-150 active:scale-95"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.fg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-fg">{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-3xl bg-gradient-to-br from-accent to-emerald-700 p-5 text-ink shadow-card-lg sm:grid-cols-4">
        <div>
          <p className="text-2xl font-black">
            {doneCount}/{totalCount}
          </p>
          <p className="mt-0.5 text-xs font-semibold opacity-90">Tugasan siap</p>
        </div>
        <div>
          <p className="text-2xl font-black">🔥 {bestStreak}</p>
          <p className="mt-0.5 text-xs font-semibold opacity-90">Streak terpanjang</p>
        </div>
        <div>
          <p className="text-2xl font-black">
            {habitsToday}/{habits.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold opacity-90">Tabiat hari ini</p>
        </div>
        <div>
          <p className="text-2xl font-black">
            {todayPrayers.length}/{PRAYERS.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold opacity-90">Solat hari ini</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tugasan Mendesak</h2>
        {visibleFocusTasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {search ? "Tiada padanan." : "Tiada tugasan mendesak. Bagus! 🎉"}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleFocusTasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <li
                  key={task.id}
                  className="flex animate-fade-in-up items-center gap-3 rounded-2xl border border-line bg-panel p-3.5 shadow-card"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black ${
                      overdue ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    {task.text.slice(0, 1).toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-fg">{task.text}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_COLOR[task.priority ?? "medium"]}`}>
                        {task.priority === "high" ? "Tinggi" : task.priority === "low" ? "Rendah" : "Sederhana"}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs font-semibold ${overdue ? "text-red-600" : "text-muted"}`}>
                          {overdue ? "Tertunggak" : "Due hari ini"}
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

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Solat Belum Ditunai</h2>
        {pendingPrayers.length === 0 ? (
          <p className="rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center text-sm font-bold text-accent">
            Lima waktu lengkap hari ini! 🤲
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {pendingPrayers.map((prayer) => (
              <li key={prayer} className="animate-fade-in-up">
                <button
                  onClick={() => markPrayerDone(prayer)}
                  className="flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 text-sm font-bold text-fg shadow-card transition-transform duration-150 active:scale-95"
                >
                  <span>{PRAYER_ICONS[prayer]}</span>
                  {PRAYER_LABELS[prayer]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tabiat Belum Siap</h2>
        {visiblePendingHabits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {search ? "Tiada padanan." : habits.length === 0 ? "Belum ada tabiat lagi." : "Semua tabiat siap hari ini. Mantap! 🔥"}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visiblePendingHabits.map((habit) => {
              const atRisk = atRiskOfMissingTwice(habit);
              return (
                <li
                  key={habit.id}
                  className="flex animate-fade-in-up items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-3.5 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-sm font-black text-violet-600">
                      {habit.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-fg">{habit.name}</p>
                      <p className="text-xs text-muted">
                        {currentStreak(habit.completions) > 0
                          ? `🔥 ${currentStreak(habit.completions)} hari berturut-turut`
                          : "Belum ada streak"}
                      </p>
                      {atRisk && <p className="mt-0.5 animate-shake text-xs font-bold text-red-600">⚠️ Jangan miss 2 hari!</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => markHabitDone(habit.id)}
                    className="rounded-full bg-dark px-4 py-2 text-xs font-bold uppercase tracking-wide text-dark-ink transition-transform duration-150 active:scale-95"
                  >
                    Siap
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
