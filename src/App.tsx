import { useState } from "react";
import TodayTab from "./TodayTab";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";
import SolatTab from "./SolatTab";

type Tab = "today" | "todo" | "habits" | "solat";

const TABS: { value: Tab; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "todo", label: "Tugasan" },
  { value: "habits", label: "Tabiat" },
  { value: "solat", label: "Solat" },
];

function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 text-xl font-black tracking-tight sm:text-2xl">
            <span className="text-white">MY</span>
            <span className="rounded-md bg-accent px-1.5 text-ink">SPACE</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto rounded-full border border-line bg-panel p-1 text-xs sm:text-sm">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 font-bold transition-colors duration-150 ${
                  tab === t.value ? "bg-accent text-ink" : "text-muted hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main key={tab} className="animate-tab-in px-4 py-8">
        {tab === "today" && <TodayTab />}
        {tab === "todo" && <TodoTab />}
        {tab === "habits" && <HabitsTab />}
        {tab === "solat" && <SolatTab />}
      </main>
    </div>
  );
}

export default App;
