import { useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Task, TaskCategory } from "./types";

const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: "personal", label: "Peribadi", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { value: "work", label: "Kerja", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "errand", label: "Urusan", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "other", label: "Lain-lain", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
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
      <form onSubmit={addTask} className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Apa yang perlu dibuat?"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="submit"
            className="ml-auto rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Tambah
          </button>
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 ${
                filter === f
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {f === "all" ? "Semua" : f === "active" ? "Belum siap" : "Siap"}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{remaining} tugasan tinggal</span>
      </div>

      <ul className="flex flex-col gap-2">
        {visibleTasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Tiada tugasan di sini.
          </li>
        )}
        {visibleTasks.map((task) => {
          const meta = categoryMeta(task.category);
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 accent-violet-600"
              />
              <div className="flex-1">
                <p className={`text-sm ${task.done ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                  {task.text}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${meta.color}`}>{meta.label}</span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">Tarikh akhir: {task.dueDate}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-slate-400 hover:text-red-500"
                aria-label="Padam"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      {tasks.some((t) => t.done) && (
        <button onClick={clearDone} className="mt-4 text-sm text-slate-400 hover:text-red-500">
          Buang semua yang siap
        </button>
      )}
    </div>
  );
}
