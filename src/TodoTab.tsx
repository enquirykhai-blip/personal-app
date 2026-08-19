import { useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Subtask, Task, TaskCategory, TaskPriority } from "./types";
import { isOverdue, sortTasks, subtaskProgress } from "./statsUtils";

const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: "personal", label: "Peribadi", color: "bg-accent/15 text-accent" },
  { value: "work", label: "Kerja", color: "bg-sky-400/15 text-sky-700" },
  { value: "errand", label: "Urusan", color: "bg-amber-400/15 text-amber-700" },
  { value: "other", label: "Lain-lain", color: "bg-zinc-400/15 text-zinc-600" },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "high", label: "Tinggi", color: "bg-red-400/15 text-red-600" },
  { value: "medium", label: "Sederhana", color: "bg-amber-400/15 text-amber-700" },
  { value: "low", label: "Rendah", color: "bg-zinc-400/15 text-zinc-600" },
];

function categoryMeta(category: TaskCategory) {
  return CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[3];
}

function priorityMeta(priority: TaskPriority | undefined) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];
}

type Filter = "all" | "active" | "done";

interface EditDraft {
  text: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
}

export default function TodoTab() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState("");

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      category,
      priority,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
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
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) } : t)),
    );
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

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEdit(id: string) {
    if (!editDraft) return;
    const trimmed = editDraft.text.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text: trimmed, category: editDraft.category, priority: editDraft.priority, dueDate: editDraft.dueDate || null }
          : t,
      ),
    );
    cancelEdit();
  }

  const visibleTasks = useMemo(() => {
    const filtered =
      filter === "active" ? tasks.filter((t) => !t.done) : filter === "done" ? tasks.filter((t) => t.done) : tasks;
    return sortTasks(filtered);
  }, [tasks, filter]);

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-black text-fg">Tugasan</h1>

      <form onSubmit={addTask} className="mb-6 flex flex-col gap-3 rounded-3xl border border-line bg-panel p-4 shadow-card">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Apa yang perlu dibuat?"
          className="rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-fg placeholder:text-muted outline-none focus:border-accent"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-fg outline-none focus:border-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-fg outline-none focus:border-accent"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                Keutamaan: {p.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-fg outline-none focus:border-accent [color-scheme:light]"
          />
          <button
            type="submit"
            className="ml-auto rounded-full bg-dark px-5 py-2 text-sm font-bold uppercase tracking-wide text-dark-ink transition-transform duration-150 active:scale-95"
          >
            Tambah
          </button>
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between border-b border-line">
        <div className="flex gap-6 text-sm">
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative pb-3 font-bold ${
                filter === f ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {f === "all" ? "Semua" : f === "active" ? "Belum siap" : "Siap"}
              {filter === f && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
        <span className="pb-3 text-xs text-muted">{remaining} tugasan tinggal</span>
      </div>

      <ul className="flex flex-col gap-2">
        {visibleTasks.length === 0 && (
          <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Tiada tugasan di sini.
          </li>
        )}
        {visibleTasks.map((task) => {
          const meta = categoryMeta(task.category);
          const pMeta = priorityMeta(task.priority);
          const overdue = isOverdue(task);

          if (editingId === task.id && editDraft) {
            return (
              <li key={task.id} className="flex flex-col gap-2 rounded-2xl border border-accent bg-panel p-3.5 shadow-card-lg">
                <input
                  value={editDraft.text}
                  onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                  className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={editDraft.category}
                    onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as TaskCategory })}
                    className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editDraft.priority}
                    onChange={(e) => setEditDraft({ ...editDraft, priority: e.target.value as TaskPriority })}
                    className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editDraft.dueDate}
                    onChange={(e) => setEditDraft({ ...editDraft, dueDate: e.target.value })}
                    className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent [color-scheme:light]"
                  />
                  <div className="ml-auto flex gap-2">
                    <button onClick={cancelEdit} className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted hover:text-fg">
                      Batal
                    </button>
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="rounded-full bg-dark px-3 py-1.5 text-xs font-bold uppercase text-dark-ink"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </li>
            );
          }

          const progress = subtaskProgress(task);
          const isExpanded = expandedId === task.id;

          return (
            <li
              key={task.id}
              className={`animate-fade-in-up rounded-2xl border p-3.5 shadow-card transition-colors duration-200 ${
                overdue ? "border-red-400/40 bg-red-400/5" : "border-line bg-panel"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black transition-colors duration-200 ${
                    task.done ? "bg-accent text-ink" : meta.color
                  }`}
                  aria-label={task.done ? "Tandakan belum siap" : "Tandakan siap"}
                >
                  {task.done ? "✓" : task.text.slice(0, 1).toUpperCase()}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors duration-200 ${task.done ? "text-muted line-through" : "text-fg"}`}>
                    {task.text}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}>{meta.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pMeta.color}`}>{pMeta.label}</span>
                    {task.dueDate && (
                      <span className={`text-xs ${overdue ? "font-bold text-red-600" : "text-muted"}`}>
                        {overdue ? "Tertunggak" : "Tarikh akhir"}: {task.dueDate}
                      </span>
                    )}
                    <button
                      onClick={() => toggleSubtaskPanel(task.id)}
                      className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors duration-150 ${
                        isExpanded ? "bg-accent text-ink" : "bg-panel-2 text-muted hover:text-fg"
                      }`}
                    >
                      🧩 {progress.total > 0 ? `${progress.done}/${progress.total}` : "Pecahkan"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => startEdit(task)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-fg active:scale-90"
                  aria-label="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-transform duration-150 hover:bg-panel-2 hover:text-red-400 active:scale-90"
                  aria-label="Padam"
                >
                  ✕
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 animate-fade-in-up border-t border-line pt-3">
                  {progress.total > 0 && (
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{ width: `${(progress.done / progress.total) * 100}%` }}
                      />
                    </div>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {(task.subtasks ?? []).map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubtask(task.id, s.id)}
                          aria-label={s.done ? "Tandakan langkah belum siap" : "Tandakan langkah siap"}
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black transition-colors duration-150 ${
                            s.done ? "bg-accent text-ink" : "border border-line bg-panel-2 text-transparent"
                          }`}
                        >
                          ✓
                        </button>
                        <span className={`flex-1 text-sm ${s.done ? "text-muted line-through" : "text-fg"}`}>{s.text}</span>
                        <button
                          onClick={() => deleteSubtask(task.id, s.id)}
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted hover:text-red-400"
                          aria-label="Padam langkah"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addSubtask(task.id);
                    }}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      value={subtaskDraft}
                      onChange={(e) => setSubtaskDraft(e.target.value)}
                      placeholder="Tambah langkah kecil..."
                      className="flex-1 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-sm text-fg placeholder:text-muted outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-dark px-3 py-1.5 text-xs font-bold uppercase text-dark-ink transition-transform duration-150 active:scale-95"
                    >
                      +
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {tasks.some((t) => t.done) && (
        <button onClick={clearDone} className="mt-4 text-sm font-semibold text-muted hover:text-red-400">
          Buang semua yang siap
        </button>
      )}
    </div>
  );
}
