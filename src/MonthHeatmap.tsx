import { useState } from "react";

const WEEKDAY_LABELS = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, monthIndex0: number, day: number) {
  return `${year}-${pad(monthIndex0 + 1)}-${pad(day)}`;
}

function bucketClass(intensity: number): string {
  if (intensity <= 0) return "bg-panel-2";
  if (intensity < 0.34) return "bg-accent/30";
  if (intensity < 0.67) return "bg-accent/55";
  if (intensity < 1) return "bg-accent/80";
  return "bg-accent";
}

interface MonthHeatmapProps {
  getIntensity: (dateISO: string) => number;
  todayISO: string;
}

export default function MonthHeatmap({ getIntensity, todayISO }: MonthHeatmapProps) {
  const now = new Date(todayISO + "T00:00:00");
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(now.getMonth());

  const firstDay = new Date(year, monthIndex0, 1);
  const leadingBlanks = firstDay.getDay();
  const daysCount = new Date(year, monthIndex0 + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString("ms-MY", { month: "long", year: "numeric" });

  function prevMonth() {
    if (monthIndex0 === 0) {
      setYear((y) => y - 1);
      setMonthIndex0(11);
    } else {
      setMonthIndex0((m) => m - 1);
    }
  }

  function nextMonth() {
    if (monthIndex0 === 11) {
      setYear((y) => y + 1);
      setMonthIndex0(0);
    } else {
      setMonthIndex0((m) => m + 1);
    }
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="Bulan sebelum"
          className="grid h-7 w-7 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-fg active:scale-90"
        >
          ‹
        </button>
        <p className="text-sm font-bold capitalize text-fg">{monthLabel}</p>
        <button
          onClick={nextMonth}
          aria-label="Bulan seterusnya"
          className="grid h-7 w-7 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-fg active:scale-90"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] font-bold text-muted">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const dateISO = isoOf(year, monthIndex0, day);
          const intensity = getIntensity(dateISO);
          const isToday = dateISO === todayISO;
          return (
            <div
              key={dateISO}
              title={dateISO}
              className={`aspect-square rounded-md ${bucketClass(intensity)} ${
                isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-panel" : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
