import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { PRAYERS, type PrayerLog } from "./types";
import { lastNDays, todayISO } from "./dateUtils";
import { PRAYER_ICONS, PRAYER_LABELS, prayerStreak, togglePrayer } from "./prayerUtils";

export default function SolatTab() {
  const [log, setLog] = useLocalStorage<PrayerLog>("prayers", {});
  const today = todayISO();
  const days = lastNDays(7);
  const todayDone = log[today] ?? [];
  const streak = useMemo(() => prayerStreak(log), [log]);

  function toggle(prayer: (typeof PRAYERS)[number]) {
    setLog((prev) => togglePrayer(prev, today, prayer));
  }

  const allDoneToday = todayDone.length === PRAYERS.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-panel p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Solat hari ini</p>
          <p className="text-2xl font-black text-white">
            {todayDone.length}/{PRAYERS.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Streak lengkap</p>
          <p className="text-2xl font-black text-accent">🔥 {streak}</p>
        </div>
      </div>

      {allDoneToday && (
        <p className="mb-6 animate-fade-in-up rounded-xl border border-accent/40 bg-accent/10 p-3 text-center text-sm font-bold text-accent">
          Alhamdulillah, lima waktu lengkap hari ini! 🤲
        </p>
      )}

      <div className="mb-8 grid grid-cols-5 gap-2">
        {PRAYERS.map((prayer) => {
          const done = todayDone.includes(prayer);
          return (
            <button
              key={prayer}
              onClick={() => toggle(prayer)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-150 active:scale-95 ${
                done
                  ? "border-accent bg-accent text-ink"
                  : "border-line bg-panel text-white hover:border-accent/50"
              }`}
            >
              <span key={done ? "on" : "off"} className={`text-2xl ${done ? "animate-pop" : ""}`}>
                {PRAYER_ICONS[prayer]}
              </span>
              <span className="text-xs font-bold">{PRAYER_LABELS[prayer]}</span>
              <span className="text-sm">{done ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">7 Hari Terkini</h2>
        <div className="flex flex-col gap-2">
          {[...days].reverse().map((day) => {
            const count = log[day]?.length ?? 0;
            const label = new Date(day + "T00:00:00").toLocaleDateString("ms-MY", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <div
                key={day}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  day === today ? "border-accent/50 bg-panel" : "border-line bg-panel"
                }`}
              >
                <span className="text-sm font-medium text-white">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {PRAYERS.map((p) => (
                      <span
                        key={p}
                        className={`h-2 w-2 rounded-full ${
                          log[day]?.includes(p) ? "bg-accent" : "bg-panel-2"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-muted">{count}/5</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
