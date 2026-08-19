import { useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Task, TaskCategory } from "./types";

const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: "personal", label: "Peribadi", color: "bg-accent/15 text-accent" },
  { value: "work", label: "Kerja", color: "bg-sky-400/15 text-sky-300" },
  { value: "errand", label: "Urusan", color: "bg-amber-400/15 text-amber-300" },
  { value: "other", label: "Lain-lain", color: "bg-zinc-400/15 text-zinc-300" },
];

function categoryMeta(category: TaskCategory) {
  return CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[3];
}

type Filter = "all" | "active" | "done";

export default function TodoTab() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      category,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setText("");
    setDueDate("");
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

  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={addTask} className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Apa yang perlu dibuat?"
          className="rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-white outline-none focus:border-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-white outline-none focus:border-accent [color-scheme:dark]"
          />
          <button
            type="submit"
            className="ml-auto rounded-lg bg-accent px-5 py-2 text-sm font-bold uppercase tracking-wide text-ink hover:brightness-110"
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
                filter === f ? "text-white" : "text-muted hover:text-white"
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
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3.5"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 accent-accent"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.done ? "text-muted line-through" : "text-white"}`}>
                  {task.text}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}>{meta.label}</span>
                  {task.dueDate && (
                    <span className="text-xs text-muted">Tarikh akhir: {task.dueDate}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-red-400"
                aria-label="Padam"
              >
                ✕
              </button>
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
