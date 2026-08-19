import { useMemo } from "react";
import { cx } from "./cx";
import { useAppData } from "./appData";
import { PRAYERS } from "./types";
import { lastNDays, todayISO } from "./dateUtils";
import { PRAYER_LABELS, prayerStreak, togglePrayer } from "./prayerUtils";
import MonthHeatmap from "./MonthHeatmap";
import { Card, ProgressRing, SectionHeader } from "./ui";

export default function SolatTab() {
  const { prayers: log, setPrayers: setLog } = useAppData();
  const today = todayISO();
  const days = lastNDays(7);
  const todayDone = log[today] ?? [];
  const streak = useMemo(() => prayerStreak(log), [log]);
  const allDone = todayDone.length === PRAYERS.length;

  function toggle(prayer: (typeof PRAYERS)[number]) {
    setLog((prev) => togglePrayer(prev, today, prayer));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="text-display text-ink">Solat</h1>
        <p className="mt-0.5 text-caption text-ink-3">Jejak lima waktu setiap hari</p>
      </header>

      {/* Today summary */}
      <Card className="mb-5 flex items-center gap-4 p-4">
        <ProgressRing value={todayDone.length} total={PRAYERS.length} size={56}>
          <span className="text-label font-bold tabular-nums text-ink">{todayDone.length}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-subtitle text-ink">
            {allDone ? "Lengkap hari ini 🤲" : `${PRAYERS.length - todayDone.length} waktu lagi`}
          </p>
          <p className="mt-0.5 text-caption text-ink-2">
            {streak > 0 ? `🔥 ${streak} hari lengkap berturut-turut` : "Lengkapkan lima waktu untuk mula streak"}
          </p>
        </div>
      </Card>

      {/* Today's five */}
      <section className="mb-7">
        <SectionHeader title="Hari ini" />
        <div className="grid grid-cols-5 gap-2">
          {PRAYERS.map((prayer) => {
            const done = todayDone.includes(prayer);
            return (
              <button
                key={prayer}
                onClick={() => toggle(prayer)}
                aria-pressed={done}
                className={cx(
                  "flex flex-col items-center justify-center gap-1.5 rounded-card border px-1 py-3.5",
                  "transition-[background-color,border-color,transform] duration-150 active:scale-95",
                  done
                    ? "border-brand bg-brand text-white shadow-e1"
                    : "border-border bg-surface text-ink-2 shadow-e1 hover:border-brand-vivid",
                )}
              >
                <span
                  className={cx(
                    "grid h-6 w-6 place-items-center rounded-full border-2 transition-colors",
                    done ? "border-white/70 bg-white/15" : "border-control",
                  )}
                >
                  {done && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-pop" aria-hidden="true">
                      <path
                        d="M3.5 8.5l3 3 6-6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-caption font-semibold">{PRAYER_LABELS[prayer]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Last 7 days — compact matrix instead of seven tall rows */}
      <section className="mb-7">
        <SectionHeader title="7 hari lepas" />
        <Card className="p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const d = new Date(day + "T00:00:00");
              const count = log[day]?.length ?? 0;
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={cx(
                    "flex flex-col items-center gap-1.5 rounded-field py-2",
                    isToday && "bg-brand-soft",
                  )}
                >
                  <span className="text-[0.625rem] font-semibold uppercase text-ink-3">
                    {d.toLocaleDateString("ms-MY", { weekday: "narrow" })}
                  </span>
                  <div className="flex flex-col gap-1" title={`${count}/5 pada ${day}`}>
                    {PRAYERS.map((p) => (
                      <span
                        key={p}
                        className={cx(
                          "h-1.5 w-4 rounded-full",
                          log[day]?.includes(p) ? "bg-brand-vivid" : "bg-surface-3",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[0.625rem] font-semibold tabular-nums text-ink-2">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Monthly heatmap */}
      <section>
        <SectionHeader title="Bulanan" />
        <MonthHeatmap
          todayISO={today}
          getIntensity={(iso) => (log[iso]?.length ?? 0) / PRAYERS.length}
        />
      </section>
    </div>
  );
}
