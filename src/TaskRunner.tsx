import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import type { Task } from "./types";
import { DEFAULT_TIMER_MINUTES, durationLabel, formatClock } from "./timeUtils";
import { playCompleteChime } from "./sound";
import { IconCheck, IconChevronRight, IconPause, IconPlay, IconX } from "./icons";
import { IconButton } from "./ui";

/** Full-screen, one-step-at-a-time runner: walks a task's steps in order with
    a live countdown, so "what do I do right now" never needs re-deciding. */
export default function TaskRunner({
  task,
  onToggleSubtask,
  onFinish,
  onClose,
}: {
  task: Task;
  onToggleSubtask: (subtaskId: string, done: boolean) => void;
  onFinish: () => void;
  onClose: () => void;
}) {
  const steps = task.subtasks ?? [];

  const [index, setIndex] = useState(() => {
    const firstUndone = steps.findIndex((s) => !s.done);
    return firstUndone === -1 ? 0 : firstUndone;
  });
  const current = steps[index];
  const stepSeconds = (s: (typeof steps)[number]) => (s.minutes && s.minutes > 0 ? s.minutes : DEFAULT_TIMER_MINUTES) * 60;

  const [remaining, setRemaining] = useState(() => stepSeconds(current));
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setRemaining(stepSeconds(steps[index]));
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  if (!current) return null;

  const total = stepSeconds(current);
  const elapsedPct = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 100;

  function goTo(nextIndex: number) {
    if (nextIndex >= steps.length) {
      onFinish();
      return;
    }
    setIndex(nextIndex);
  }

  function complete() {
    playCompleteChime();
    if (!current.done) onToggleSubtask(current.id, true);
    goTo(index + 1);
  }

  function skip() {
    goTo(index + 1);
  }

  function backToPrevious() {
    if (index > 0) setIndex(index - 1);
  }

  const remainingCount = steps.length - index;
  const eta = new Date(
    Date.now() + remaining * 1000 + steps.slice(index + 1).reduce((n, s) => n + stepSeconds(s), 0) * 1000,
  ).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });
  const previous = index > 0 ? steps[index - 1] : null;
  const next = steps[index + 1] ?? null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Progress dots + close */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={cx(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold transition-colors",
                s.done
                  ? "bg-ink text-white"
                  : i === index
                    ? "border-2 border-ink text-ink"
                    : "border border-border text-ink-3",
              )}
              aria-hidden="true"
            >
              {s.done ? <IconCheck className="h-3 w-3" /> : i + 1}
            </span>
          ))}
        </div>
        <IconButton label="Tutup mod fokus" onClick={onClose}>
          <IconX className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {previous && (
          <button
            type="button"
            onClick={backToPrevious}
            className="mb-3 flex items-center justify-between gap-3 rounded-field border border-border bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3"
          >
            <span className="min-w-0">
              <span className="block text-caption text-ink-3">Langkah sebelum ini</span>
              <span className="block truncate text-label font-medium text-ink-3 line-through">{previous.text}</span>
            </span>
            <span className="shrink-0 text-caption font-semibold text-ink underline">Kembali</span>
          </button>
        )}

        <div className="relative flex min-h-[16rem] flex-1 flex-col justify-between overflow-hidden rounded-sheet bg-ink p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-caption text-white/60">Sekarang</p>
              <p className="text-caption text-white/60">{durationLabel(total / 60)} dijadualkan</p>
            </div>
            {current.emoji && (
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-field bg-white/15 text-xl"
                aria-hidden="true"
              >
                {current.emoji}
              </span>
            )}
          </div>

          <div className="my-4">
            <p
              role="timer"
              aria-live="polite"
              className={cx("text-[3rem] font-black leading-none tabular-nums", remaining === 0 && "animate-pulse")}
            >
              {remaining === 0 ? "Siap! 🎉" : formatClock(remaining)}
            </p>
            <p className="mt-3 text-title font-bold">{current.text}</p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
              style={{ width: `${elapsedPct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(elapsedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {next && (
          <div className="mt-3 rounded-field border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-caption text-ink-3">Langkah seterusnya</p>
            <p className="text-label font-medium text-ink">{next.text}</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1.5 text-caption">
          <div className="flex items-center justify-between">
            <span className="text-ink-3">Semua langkah dijangka siap</span>
            <span className="font-semibold text-ink">{eta}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-3">Baki langkah</span>
            <span className="font-semibold text-ink">{remainingCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around border-t border-border px-4 py-4">
        <button
          type="button"
          onClick={() => setRunning((r) => remaining > 0 && !r)}
          className="flex flex-col items-center gap-1 text-ink-2 transition-colors hover:text-ink"
        >
          {running ? <IconPause className="h-6 w-6" /> : <IconPlay className="h-6 w-6" />}
          <span className="text-caption font-semibold">{running ? "Jeda" : "Sambung"}</span>
        </button>

        <button
          type="button"
          onClick={complete}
          aria-label="Tandakan siap dan ke langkah seterusnya"
          className="grid h-16 w-16 place-items-center rounded-full bg-ink text-white shadow-e3 transition-transform active:scale-95"
        >
          <IconCheck className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={skip}
          className="flex flex-col items-center gap-1 text-ink-2 transition-colors hover:text-ink"
        >
          <IconChevronRight className="h-6 w-6" />
          <span className="text-caption font-semibold">Langkau</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
