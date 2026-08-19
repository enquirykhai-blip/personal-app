import { useState } from "react";
import { cx } from "./cx";
import { IconChevronLeft, IconChevronRight } from "./icons";
import { Card, IconButton } from "./ui";

const WEEKDAYS = ["A", "I", "S", "R", "K", "J", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, month0: number, day: number) {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

/** Five buckets so partial days stay readable without a legend lookup. */
function levelOf(intensity: number): 0 | 1 | 2 | 3 | 4 {
  if (intensity <= 0) return 0;
  if (intensity < 0.34) return 1;
  if (intensity < 0.67) return 2;
  if (intensity < 1) return 3;
  return 4;
}

const LEVEL_CLASS: Record<number, string> = {
  0: "bg-surface-3",
  1: "bg-brand-vivid/25",
  2: "bg-brand-vivid/50",
  3: "bg-brand-vivid/75",
  4: "bg-brand-vivid",
};

export default function MonthHeatmap({
  getIntensity,
  todayISO,
}: {
  getIntensity: (dateISO: string) => number;
  todayISO: string;
}) {
  const now = new Date(todayISO + "T00:00:00");
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  const first = new Date(year, month0, 1);
  const blanks = first.getDay();
  const dayCount = new Date(year, month0 + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString("ms-MY", { month: "long", year: "numeric" });

  const isCurrentMonth = year === now.getFullYear() && month0 === now.getMonth();

  function shift(delta: number) {
    const d = new Date(year, month0 + delta, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }

  return (
    <Card className="p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Bulan sebelum" onClick={() => shift(-1)}>
          <IconChevronLeft className="h-4 w-4" />
        </IconButton>
        <p className="text-label font-semibold capitalize text-ink">{monthLabel}</p>
        <IconButton
          label="Bulan seterusnya"
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          className="disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronRight className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="pb-0.5 text-center text-[0.625rem] font-semibold text-ink-3">
            {w}
          </div>
        ))}

        {Array.from({ length: blanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
          const iso = isoOf(year, month0, day);
          const level = levelOf(getIntensity(iso));
          const isToday = iso === todayISO;
          return (
            <div
              key={iso}
              title={`${day} ${monthLabel}`}
              className={cx(
                "aspect-square rounded-[0.3rem] transition-colors duration-200",
                LEVEL_CLASS[level],
                isToday && "ring-2 ring-brand ring-offset-1 ring-offset-surface",
              )}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[0.625rem] text-ink-3">Kurang</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={cx("h-2.5 w-2.5 rounded-[0.2rem]", LEVEL_CLASS[l])} />
        ))}
        <span className="text-[0.625rem] text-ink-3">Banyak</span>
      </div>
    </Card>
  );
}
