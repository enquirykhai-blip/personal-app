import { useState } from "react";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";

type Tab = "todo" | "habits";

function App() {
  const [tab, setTab] = useState<Tab>("todo");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-1 text-2xl font-black tracking-tight">
            <span className="text-white">MY</span>
            <span className="rounded-md bg-accent px-1.5 text-ink">SPACE</span>
          </div>
          <nav className="flex gap-1 rounded-full border border-line bg-panel p-1 text-sm">
            <button
              onClick={() => setTab("todo")}
              className={`rounded-full px-4 py-1.5 font-bold transition ${
                tab === "todo" ? "bg-accent text-ink" : "text-muted hover:text-white"
              }`}
            >
              Tugasan
            </button>
            <button
              onClick={() => setTab("habits")}
              className={`rounded-full px-4 py-1.5 font-bold transition ${
                tab === "habits" ? "bg-accent text-ink" : "text-muted hover:text-white"
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
