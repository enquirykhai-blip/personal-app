import { Fragment, useEffect, useMemo, useState } from "react";
import { cx } from "./cx";
import { useLocalStorage } from "./useLocalStorage";
import { useAppData } from "./appData";
import type { Subtask, Task, TaskCategory, TaskPriority } from "./types";
import { isOverdue, sortTasks, subtaskProgress } from "./statsUtils";
import { todayISO } from "./dateUtils";
import { DEFAULT_OPENROUTER_MODEL, generateSubtasks } from "./ai";
import { DEFAULT_TIMER_MINUTES, durationLabel, formatClock } from "./timeUtils";
import { celebrateTaskDone } from "./celebrate";
import TaskRunner from "./TaskRunner";
import {
  IconChevronDown,
  IconPause,
  IconPencil,
  IconPlay,
  IconPlus,
  IconSearch,
  IconSliders,
  IconSparkles,
  IconSplit,
  IconTrash,
  IconX,
} from "./icons";
import { Button, Card, Checkbox, EmptyState, IconButton, PriorityMark, SelectField, TextField } from "./ui";

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "personal", label: "Peribadi" },
  { value: "work", label: "Kerja" },
  { value: "errand", label: "Urusan" },
  { value: "other", label: "Lain-lain" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sederhana" },
  { value: "low", label: "Rendah" },
];

function categoryLabel(c: TaskCategory) {
  return CATEGORIES.find((x) => x.value === c)?.label ?? "Lain-lain";
}

function priorityMeta(p: TaskPriority | undefined) {
  return PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[1];
}

/** Human-friendly due date: relative when near, short date otherwise. */
function dueLabel(iso: string): string {
  const today = new Date(todayISO() + "T00:00:00").getTime();
  const due = new Date(iso + "T00:00:00").getTime();
  const days = Math.round((due - today) / 86400000);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Esok";
  if (days === -1) return "Semalam";
  if (days > 1 && days < 7) return `${days} hari lagi`;
  if (days < -1) return `Lewat ${Math.abs(days)} hari`;
  return new Date(iso + "T00:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
}

type Filter = "active" | "done" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "Belum siap" },
  { value: "done", label: "Siap" },
  { value: "all", label: "Semua" },
];

interface EditDraft {
  text: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
}

export default function TodoTab({ expandTaskId }: { expandTaskId?: string | null }) {
  const { tasks, setTasks } = useAppData();
  /* Read-only here: the key and model are configured in Settings. */
  const [apiKey] = useLocalStorage("gemini_api_key", "");
  const [aiModel] = useLocalStorage("ai_model", DEFAULT_OPENROUTER_MODEL);

  const [text, setText] = useState("");
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  /* Arriving from the Today screen's "Pecahkan" opens that task's steps. App
     remounts this tab on navigation, so seeding state here is enough — no effect. */
  const [expandedId, setExpandedId] = useState<string | null>(expandTaskId ?? null);
  const [subtaskDraft, setSubtaskDraft] = useState("");

  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<{ id: string; message: string } | null>(null);

  /* Tapping a step starts a focus timer for it — counts down from its AI
     estimate (or a 5-minute default), one step at a time. */
  const [timer, setTimer] = useState<{
    taskId: string;
    subtaskId: string;
    total: number;
    remaining: number;
    running: boolean;
  } | null>(null);

  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => {
      setTimer((t) => (t ? { ...t, remaining: Math.max(0, t.remaining - 1), running: t.remaining > 1 } : t));
    }, 1000);
    return () => clearInterval(id);
  }, [timer?.running, timer?.subtaskId]);

  /* Full-screen step-by-step runner for one task at a time. */
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const runningTask = tasks.find((t) => t.id === runningTaskId) ?? null;

  function runnerToggleSubtask(subtaskId: string, done: boolean) {
    if (!runningTaskId) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === runningTaskId
          ? { ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? { ...s, done } : s)) }
          : t,
      ),
    );
  }

  function runnerFinish() {
    if (runningTaskId) {
      const finished = tasks.find((t) => t.id === runningTaskId);
      setTasks((prev) => prev.map((t) => (t.id === runningTaskId ? { ...t, done: true } : t)));
      if (finished) celebrateTaskDone(finished.text);
    }
    setRunningTaskId(null);
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
        category,
        priority,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setText("");
    setDueDate("");
    setPriority("medium");
  }

  function toggleTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.done) celebrateTaskDone(task.text);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function clearDone() {
    setTasks((prev) => prev.filter((t) => !t.done));
  }

  function toggleSubtaskPanel(id: string) {
    setExpandedId(expandedId === id ? null : id);
    setSubtaskDraft("");
    setAiError(null);
    setTimer(null);
  }

  function openTimer(taskId: string, subtask: Subtask) {
    if (timer?.subtaskId === subtask.id) {
      setTimer(null);
      return;
    }
    const total = (subtask.minutes && subtask.minutes > 0 ? subtask.minutes : DEFAULT_TIMER_MINUTES) * 60;
    setTimer({ taskId, subtaskId: subtask.id, total, remaining: total, running: true });
  }

  function toggleTimerRunning() {
    setTimer((t) => (t ? { ...t, running: t.remaining > 0 && !t.running } : t));
  }

  function adjustTimer(deltaSeconds: number) {
    setTimer((t) => (t ? { ...t, remaining: Math.max(0, t.remaining + deltaSeconds) } : t));
  }

  function addSubtask(taskId: string) {
    const trimmed = subtaskDraft.trim();
    if (!trimmed) return;
    const subtask: Subtask = { id: crypto.randomUUID(), text: trimmed, done: false };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] } : t)),
    );
    setSubtaskDraft("");
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
          : t,
      ),
    );
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) } : t,
      ),
    );
    setTimer((t) => (t?.subtaskId === subtaskId ? null : t));
  }

  async function handleGenerate(task: Task) {
    setAiError(null);
    if (!apiKey) {
      setAiError({ id: task.id, message: "Tambah API key dalam Tetapan untuk guna AI." });
      return;
    }
    setAiLoadingId(task.id);
    try {
      const generated = await generateSubtasks(apiKey, task.text, aiModel);
      const newSubtasks: Subtask[] = generated.map((g) => ({
        id: crypto.randomUUID(),
        text: g.text,
        done: false,
        emoji: g.emoji || undefined,
        minutes: g.minutes || undefined,
      }));
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, subtasks: [...(t.subtasks ?? []), ...newSubtasks] } : t)),
      );
    } catch (err) {
      setAiError({ id: task.id, message: err instanceof Error ? err.message : "Ralat tidak diketahui." });
    } finally {
      setAiLoadingId(null);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditDraft({
      text: task.text,
      category: task.category,
      priority: task.priority ?? "medium",
      dueDate: task.dueDate ?? "",
    });
  }

  function saveEdit(id: string) {
    if (!editDraft) return;
    const trimmed = editDraft.text.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              text: trimmed,
              category: editDraft.category,
              priority: editDraft.priority,
              dueDate: editDraft.dueDate || null,
            }
          : t,
      ),
    );
    setEditingId(null);
    setEditDraft(null);
  }

  const visibleTasks = useMemo(() => {
    const byState =
      filter === "active" ? tasks.filter((t) => !t.done) : filter === "done" ? tasks.filter((t) => t.done) : tasks;
    const q = search.trim().toLowerCase();
    const bySearch = q ? byState.filter((t) => t.text.toLowerCase().includes(q)) : byState;
    return sortTasks(bySearch);
  }, [tasks, filter, search]);

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <>
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="text-display text-ink">Tugasan</h1>
        <p className="mt-0.5 text-caption text-ink-3">
          {remaining > 0 ? `${remaining} belum siap` : "Semua selesai"}
        </p>
      </header>

      {/* Quick capture — one field, options tucked away to keep friction low */}
      <Card className="mb-5 p-3">
        <form onSubmit={addTask}>
          <div className="flex gap-2">
            <TextField
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Apa yang perlu dibuat?"
              aria-label="Tugasan baharu"
            />
            <Button type="submit" disabled={!text.trim()} className="px-4">
              <IconPlus className="h-5 w-5" />
              <span className="sr-only">Tambah tugasan</span>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            aria-expanded={showOptions}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-caption font-semibold text-ink-3 transition-colors hover:text-ink"
          >
            <IconSliders className="h-4 w-4" />
            Pilihan
            <IconChevronDown className={cx("h-3.5 w-3.5 transition-transform", showOptions && "rotate-180")} />
          </button>

          {showOptions && (
            <div className="mt-1 grid animate-rise grid-cols-2 gap-2 sm:grid-cols-3">
              <SelectField
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                aria-label="Kategori"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                aria-label="Keutamaan"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Tarikh akhir"
                className="col-span-2 text-label sm:col-span-1"
              />
            </div>
          )}
        </form>
      </Card>

      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugasan"
            aria-label="Cari tugasan"
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Kosongkan carian"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        <div role="tablist" aria-label="Tapis tugasan" className="flex gap-1 rounded-full bg-surface-3 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cx(
                "flex-1 rounded-full py-2 text-caption font-semibold transition-colors duration-150",
                filter === f.value ? "bg-surface text-ink shadow-e1" : "text-ink-2 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {visibleTasks.length === 0 ? (
        <EmptyState
          icon={search ? "🔍" : filter === "done" ? "📭" : "✅"}
          title={search ? "Tiada padanan" : filter === "done" ? "Belum ada yang siap" : "Tiada tugasan tertunggak"}
          hint={search ? `Tiada tugasan sepadan dengan "${search}".` : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleTasks.map((task) => {
            const pMeta = priorityMeta(task.priority);
            const overdue = isOverdue(task);
            const progress = subtaskProgress(task);
            /* Sum of the AI's per-step estimates: a concrete answer to
               "how long will this actually take?" */
            const totalMinutes = (task.subtasks ?? []).reduce((n, st) => n + (st.minutes ?? 0), 0);
            const isExpanded = expandedId === task.id;
            const isEditing = editingId === task.id;

            /* Built as a list so a separator can never dangle at the end of a wrapped line. */
            const metaParts = [
              <span key="p" className="inline-flex items-center gap-1.5">
                <PriorityMark level={task.priority ?? "medium"} className="text-ink" />
                {pMeta.label}
              </span>,
              <span key="c">{categoryLabel(task.category)}</span>,
              task.dueDate ? (
                <span key="d" className={cx(overdue && !task.done && "font-semibold text-ink underline")}>
                  {dueLabel(task.dueDate)}
                </span>
              ) : null,
              totalMinutes > 0 ? <span key="t">~{durationLabel(totalMinutes)}</span> : null,
            ].filter(Boolean);

            if (isEditing && editDraft) {
              return (
                <li key={task.id}>
                  <Card className="animate-rise border-brand p-3 shadow-e2">
                    <TextField
                      value={editDraft.text}
                      onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                      aria-label="Teks tugasan"
                      autoFocus
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <SelectField
                        value={editDraft.category}
                        onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as TaskCategory })}
                        aria-label="Kategori"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        value={editDraft.priority}
                        onChange={(e) => setEditDraft({ ...editDraft, priority: e.target.value as TaskPriority })}
                        aria-label="Keutamaan"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </SelectField>
                      <TextField
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(e) => setEditDraft({ ...editDraft, dueDate: e.target.value })}
                        aria-label="Tarikh akhir"
                        className="col-span-2 text-label sm:col-span-1"
                      />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Batal
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(task.id)}>
                        Simpan
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            }

            return (
              <li key={task.id}>
                <Card
                  className={cx(
                    "animate-rise overflow-hidden transition-colors duration-200",
                    overdue && !task.done && "border-danger/30",
                  )}
                >
                  <div className="flex items-center gap-1 p-2">
                    <Checkbox
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      label={task.done ? `Tandakan ${task.text} belum siap` : `Tandakan ${task.text} siap`}
                    />

                    {/* The whole row body toggles the steps panel — one large, obvious target. */}
                    <button
                      onClick={() => toggleSubtaskPanel(task.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Langkah untuk ${task.text}`}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-field py-1 pr-1 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={cx(
                            "block text-label font-medium transition-colors duration-200",
                            task.done ? "text-ink-3 line-through" : "text-ink",
                          )}
                        >
                          {task.text}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption text-ink-3">
                          {metaParts.map((part, i) => (
                            <Fragment key={i}>
                              {i > 0 && <span aria-hidden="true">·</span>}
                              {part}
                            </Fragment>
                          ))}
                        </span>
                      </span>

                      <span
                        className={cx(
                          "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-caption font-semibold transition-colors",
                          isExpanded || progress.total > 0 ? "bg-surface-2 text-ink" : "text-ink-3",
                        )}
                      >
                        <IconSplit className="h-4 w-4" />
                        {progress.total > 0 && (
                          <span className="tabular-nums">
                            {progress.done}/{progress.total}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>

                  {isExpanded && progress.total > 0 && (
                    <div className="h-1 bg-surface-3">
                      <div
                        className="h-full bg-brand-vivid transition-[width] duration-500 ease-out"
                        style={{ width: `${(progress.done / progress.total) * 100}%` }}
                        role="progressbar"
                        aria-valuenow={progress.done}
                        aria-valuemin={0}
                        aria-valuemax={progress.total}
                        aria-label="Kemajuan langkah"
                      />
                    </div>
                  )}

                  {isExpanded && (
                    <div className="animate-rise border-t border-border bg-surface-2/50 p-3">
                      {(task.subtasks ?? []).length > 0 && (
                        <ul className="mb-1 flex flex-col gap-0.5">
                          {(task.subtasks ?? []).map((s) => {
                            const activeTimer = timer?.subtaskId === s.id ? timer : null;
                            return (
                              <li key={s.id} className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    size="sm"
                                    checked={s.done}
                                    onChange={() => toggleSubtask(task.id, s.id)}
                                    label={s.done ? `Tandakan ${s.text} belum siap` : `Tandakan ${s.text} siap`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openTimer(task.id, s)}
                                    aria-expanded={!!activeTimer}
                                    aria-label={`Mula pemasa untuk ${s.text}`}
                                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-field py-1 text-left"
                                  >
                                    {s.emoji && (
                                      <span
                                        className={cx(
                                          "grid h-7 w-7 shrink-0 place-items-center rounded-field bg-surface-2 text-[0.875rem]",
                                          s.done && "opacity-40",
                                        )}
                                        aria-hidden="true"
                                      >
                                        {s.emoji}
                                      </span>
                                    )}
                                    <span
                                      className={cx(
                                        "flex-1 text-label",
                                        s.done ? "text-ink-3 line-through" : "text-ink-2",
                                      )}
                                    >
                                      {s.text}
                                    </span>
                                    {s.minutes ? (
                                      <span
                                        className={cx(
                                          "shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6875rem] font-semibold",
                                          activeTimer
                                            ? "border-ink text-ink"
                                            : s.done
                                              ? "border-border text-ink-3"
                                              : "border-border text-ink-2",
                                        )}
                                      >
                                        {durationLabel(s.minutes)}
                                      </span>
                                    ) : null}
                                  </button>
                                  <IconButton
                                    label="Padam langkah"
                                    danger
                                    className="h-9 w-9"
                                    onClick={() => deleteSubtask(task.id, s.id)}
                                  >
                                    <IconX className="h-3.5 w-3.5" />
                                  </IconButton>
                                </div>

                                {activeTimer && (
                                  <div className="mb-1 ml-8 flex animate-rise items-center gap-1 rounded-field bg-ink px-2 py-2 text-white">
                                    <button
                                      type="button"
                                      onClick={() => adjustTimer(-5)}
                                      aria-label="Kurang 5 saat"
                                      className="grid h-8 w-9 shrink-0 place-items-center rounded-field text-caption font-bold text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                                    >
                                      -5
                                    </button>
                                    <span
                                      role="timer"
                                      aria-live="polite"
                                      className={cx(
                                        "flex-1 text-center text-title font-bold tabular-nums",
                                        activeTimer.remaining === 0 && "animate-pulse",
                                      )}
                                    >
                                      {activeTimer.remaining === 0 ? "Siap! 🎉" : formatClock(activeTimer.remaining)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => adjustTimer(5)}
                                      aria-label="Tambah 5 saat"
                                      className="grid h-8 w-9 shrink-0 place-items-center rounded-field text-caption font-bold text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                                    >
                                      +5
                                    </button>
                                    {activeTimer.remaining > 0 && (
                                      <IconButton
                                        label={activeTimer.running ? "Jeda pemasa" : "Sambung pemasa"}
                                        onClick={toggleTimerRunning}
                                        className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                                      >
                                        {activeTimer.running ? (
                                          <IconPause className="h-4 w-4" />
                                        ) : (
                                          <IconPlay className="h-4 w-4" />
                                        )}
                                      </IconButton>
                                    )}
                                    <IconButton
                                      label="Tutup pemasa"
                                      onClick={() => setTimer(null)}
                                      className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                                    >
                                      <IconX className="h-4 w-4" />
                                    </IconButton>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addSubtask(task.id);
                        }}
                        className="flex gap-2"
                      >
                        <TextField
                          value={subtaskDraft}
                          onChange={(e) => setSubtaskDraft(e.target.value)}
                          placeholder="Langkah kecil…"
                          aria-label="Langkah baharu"
                          className="h-10 text-label"
                        />
                        <Button type="submit" size="sm" variant="secondary" disabled={!subtaskDraft.trim()}>
                          <IconPlus className="h-4 w-4" />
                          <span className="sr-only">Tambah langkah</span>
                        </Button>
                      </form>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleGenerate(task)}
                          disabled={aiLoadingId === task.id}
                        >
                          <IconSparkles className={cx("h-4 w-4", aiLoadingId === task.id && "animate-pulse")} />
                          {aiLoadingId === task.id ? "Menjana…" : "Jana dengan AI"}
                        </Button>
                        {(task.subtasks ?? []).some((s) => !s.done) && (
                          <Button size="sm" variant="brand" onClick={() => setRunningTaskId(task.id)}>
                            <IconPlay className="h-4 w-4" />
                            Mula
                          </Button>
                        )}
                      </div>

                      {aiError?.id === task.id && (
                        <p role="alert" className="mt-2 text-caption font-medium text-danger">
                          {aiError.message}
                        </p>
                      )}

                      <div className="mt-3 flex justify-end gap-1 border-t border-border pt-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(task)}>
                          <IconPencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="text-danger hover:bg-danger-soft hover:text-danger"
                        >
                          <IconTrash className="h-4 w-4" />
                          Padam
                        </Button>
                      </div>

                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.some((t) => t.done) && (
        <div className="mt-5 flex justify-center">
          <Button variant="ghost" size="sm" onClick={clearDone}>
            Buang semua yang siap
          </Button>
        </div>
      )}
    </div>

    {runningTask && (
      <TaskRunner
        task={runningTask}
        onToggleSubtask={runnerToggleSubtask}
        onFinish={runnerFinish}
        onClose={() => setRunningTaskId(null)}
      />
    )}
    </>
  );
}
