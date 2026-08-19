import { useState } from "react";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";

type Tab = "todo" | "habits";

function App() {
  const [tab, setTab] = useState<Tab>("todo");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">My Space</h1>
          <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
            <button
              onClick={() => setTab("todo")}
              className={`rounded-md px-3 py-1.5 ${
                tab === "todo"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Tugasan
            </button>
            <button
              onClick={() => setTab("habits")}
              className={`rounded-md px-3 py-1.5 ${
                tab === "habits"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Tabiat
            </button>
          </nav>
        </div>
      </header>

      <main className="px-4 py-8">{tab === "todo" ? <TodoTab /> : <HabitsTab />}</main>
    </div>
  );
}

export default App;
