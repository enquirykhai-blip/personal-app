import { useState } from "react";
import TodayTab from "./TodayTab";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";

type Tab = "today" | "todo" | "habits";

const TABS: { value: Tab; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "todo", label: "Tugasan" },
  { value: "habits", label: "Tabiat" },
];

function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-1 text-2xl font-black tracking-tight">
            <span className="text-white">MY</span>
            <span className="rounded-md bg-accent px-1.5 text-ink">SPACE</span>
          </div>
          <nav className="flex gap-1 rounded-full border border-line bg-panel p-1 text-sm">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`rounded-full px-4 py-1.5 font-bold transition ${
                  tab === t.value ? "bg-accent text-ink" : "text-muted hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-4 py-8">
        {tab === "today" && <TodayTab />}
        {tab === "todo" && <TodoTab />}
        {tab === "habits" && <HabitsTab />}
      </main>
    </div>
  );
}

export default App;
