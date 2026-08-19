import { useState, type ReactElement } from "react";
import TodayTab from "./TodayTab";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";
import SolatTab from "./SolatTab";
import { IconHome, IconList, IconMoon, IconRepeat } from "./icons";

type Tab = "today" | "todo" | "habits" | "solat";

const TABS: { value: Tab; label: string; icon: (props: { className?: string }) => ReactElement }[] = [
  { value: "today", label: "Utama", icon: IconHome },
  { value: "todo", label: "Tugasan", icon: IconList },
  { value: "habits", label: "Tabiat", icon: IconRepeat },
  { value: "solat", label: "Solat", icon: IconMoon },
];

function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="min-h-screen bg-canvas">
      <main key={tab} className="animate-tab-in px-4 pb-28 pt-6">
        {tab === "today" && <TodayTab onNavigate={setTab} />}
        {tab === "todo" && <TodoTab />}
        {tab === "habits" && <HabitsTab />}
        {tab === "solat" && <SolatTab />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
        <div className="flex w-full max-w-sm items-center justify-between gap-1 rounded-full border border-line bg-panel p-2 shadow-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-colors duration-150 ${
                  active ? "bg-accent text-ink" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
