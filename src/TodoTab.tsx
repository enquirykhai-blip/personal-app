import { Fragment, useMemo, useState } from "react";
import { cx } from "./cx";
import { useLocalStorage } from "./useLocalStorage";
import { useAppData } from "./appData";
import type { Subtask, Task, TaskCategory, TaskPriority } from "./types";
import { isOverdue, sortTasks, subtaskProgress } from "./statsUtils";
import { todayISO } from "./dateUtils";
import { DEFAULT_OPENROUTER_MODEL, detectProvider, generateSubtasks } from "./ai";
import {
  IconChevronDown,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSliders,
  IconSparkles,
  IconSplit,
  IconTrash,
  IconX,
} from "./icons";
import { Button, Card, Checkbox, EmptyState, IconButton, SelectField, TextField } from "./ui";

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "personal", label: "Peribadi" },
  { value: "work", label: "Kerja" },
  { value: "errand", label: "Urusan" },
  { value: "other", label: "Lain-lain" },
];

const PRIORITIES: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "high", label: "Tinggi", dot: "bg-danger" },
  { value: "medium", label: "Sederhana", dot: "bg-warn" },
  { value: "low", label: "Rendah", dot: "bg-ink-3" },
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
  /* Key stays under its original storage name so existing users keep theirs. */
  const [apiKey, setApiKey] = useLocalStorage("gemini_api_key", "");
  const [aiModel, setAiModel] = useLocalStorage("ai_model", DEFAULT_OPENROUTER_MODEL);

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

  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<{ id: string; message: string } | null>(null);

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
    setShowKeyForm(false);
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
  }

  function saveApiKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setAiModel(modelDraft.trim() || DEFAULT_OPENROUTER_MODEL);
    setApiKeyDraft("");
    setShowKeyForm(false);
  }

  async function handleGenerate(task: Task) {
    setAiError(null);
    if (!apiKey) {
      setShowKeyForm(true);
      return;
    }
    setAiLoadingId(task.id);
    try {
      const generated = await generateSubtasks(apiKey, task.text, aiModel);
      const newSubtasks: Subtask[] = generated.map((t) => ({ id: crypto.randomUUID(), text: t, done: false }));
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
  const draftProvider = detectProvider(apiKeyDraft);

  return (
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
            const isExpanded = expandedId === task.id;
            const isEditing = editingId === task.id;

            /* Built as a list so a separator can never dangle at the end of a wrapped line. */
            const metaParts = [
              <span key="p" className="inline-flex items-center gap-1.5">
                <span className={cx("h-1.5 w-1.5 rounded-full", pMeta.dot)} aria-hidden="true" />
                {pMeta.label}
              </span>,
              <span key="c">{categoryLabel(task.category)}</span>,
              task.dueDate ? (
                <span key="d" className={cx(overdue && !task.done && "font-semibold text-danger")}>
                  {dueLabel(task.dueDate)}
                </span>
              ) : null,
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
                          isExpanded || progress.total > 0 ? "bg-plum-soft text-plum" : "text-ink-3",
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
                        <ul className="mb-1 flex flex-col">
                          {(task.subtasks ?? []).map((s) => (
                            <li key={s.id} className="flex items-center gap-1">
                              <Checkbox
                                size="sm"
                                checked={s.done}
                                onChange={() => toggleSubtask(task.id, s.id)}
                                label={s.done ? `Tandakan ${s.text} belum siap` : `Tandakan ${s.text} siap`}
                              />
                              <span
                                className={cx(
                                  "flex-1 text-label",
                                  s.done ? "text-ink-3 line-through" : "text-ink-2",
                                )}
                              >
                                {s.text}
                              </span>
                              <IconButton
                                label="Padam langkah"
                                danger
                                className="h-9 w-9"
                                onClick={() => deleteSubtask(task.id, s.id)}
                              >
                                <IconX className="h-3.5 w-3.5" />
                              </IconButton>
                            </li>
                          ))}
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
                          className="border-plum/25 bg-plum-soft text-plum hover:bg-plum-soft/70"
                        >
                          <IconSparkles className={cx("h-4 w-4", aiLoadingId === task.id && "animate-pulse")} />
                          {aiLoadingId === task.id ? "Menjana…" : "Jana dengan AI"}
                        </Button>
                        {apiKey && (
                          <button
                            onClick={() => setShowKeyForm((v) => !v)}
                            className="text-caption font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline"
                          >
                            Tukar API key
                          </button>
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

                      {showKeyForm && (
                        <form onSubmit={saveApiKey} className="mt-2.5 rounded-field border border-border bg-surface p-3">
                          <p className="text-caption text-ink-2">
                            Tampal API key <strong className="font-semibold text-ink">Gemini</strong> atau{" "}
                            <strong className="font-semibold text-ink">OpenRouter</strong> — jenisnya dikesan automatik.
                            Key disimpan dalam browser ini sahaja dan tidak pernah masuk ke dalam kod.
                          </p>
                          <div className="mt-2 flex gap-2">
                            <TextField
                              type="password"
                              value={apiKeyDraft}
                              onChange={(e) => setApiKeyDraft(e.target.value)}
                              placeholder="API key"
                              aria-label="API key AI"
                              autoComplete="off"
                              className="h-10 text-label"
                            />
                            <Button type="submit" size="sm" disabled={!apiKeyDraft.trim()}>
                              Simpan
                            </Button>
                          </div>

                          {draftProvider === "openrouter" && (
                            <div className="mt-2 animate-rise">
                              <label className="text-caption font-medium text-ink-2" htmlFor={`model-${task.id}`}>
                                Model OpenRouter
                              </label>
                              <TextField
                                id={`model-${task.id}`}
                                value={modelDraft}
                                onChange={(e) => setModelDraft(e.target.value)}
                                placeholder={DEFAULT_OPENROUTER_MODEL}
                                className="mt-1 h-10 text-label"
                              />
                              <p className="mt-1 text-caption text-ink-3">
                                Tukar jika model ini tiada pada akaun anda — senarai di{" "}
                                <a
                                  href="https://openrouter.ai/models"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-brand underline underline-offset-2"
                                >
                                  openrouter.ai/models
                                </a>
                                .
                              </p>
                            </div>
                          )}

                          <p className="mt-2 text-caption text-ink-3">
                            Dapatkan key:{" "}
                            <a
                              href="https://aistudio.google.com/apikey"
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand underline underline-offset-2"
                            >
                              Google AI Studio
                            </a>{" "}
                            ·{" "}
                            <a
                              href="https://openrouter.ai/keys"
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand underline underline-offset-2"
                            >
                              OpenRouter
                            </a>
                          </p>
                        </form>
                      )}
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
  );
}
