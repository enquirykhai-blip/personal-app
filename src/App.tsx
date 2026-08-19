import { useEffect, useState, type ReactElement } from "react";
import { cx } from "./cx";
import TodayTab from "./TodayTab";
import TodoTab from "./TodoTab";
import HabitsTab from "./HabitsTab";
import SolatTab from "./SolatTab";
import SettingsTab from "./SettingsTab";
import SuccessCelebration from "./SuccessCelebration";
import { onCelebrate } from "./celebrate";
import { IconHome, IconList, IconMoon, IconRepeat, IconSettings } from "./icons";

export type Tab = "today" | "todo" | "habits" | "solat" | "settings";

const TABS: { value: Tab; label: string; icon: (p: { className?: string }) => ReactElement }[] = [
  { value: "today", label: "Utama", icon: IconHome },
  { value: "todo", label: "Tugasan", icon: IconList },
  { value: "habits", label: "Tabiat", icon: IconRepeat },
  { value: "solat", label: "Solat", icon: IconMoon },
  { value: "settings", label: "Tetapan", icon: IconSettings },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [expandTaskId, setExpandTaskId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  useEffect(() => onCelebrate(setCelebrating), []);

  /* A deep link carries an optional task to open, so "Pecahkan" on the Today
     screen lands on that task's steps instead of just switching tabs. */
  function navigate(next: Tab, taskId?: string) {
    setTab(next);
    setExpandTaskId(taskId ?? null);
  }

  return (
    <div className="min-h-screen bg-bg">
      <main key={tab} className="animate-rise px-4 pb-32 pt-7">
        {tab === "today" && <TodayTab onNavigate={navigate} />}
        {tab === "todo" && <TodoTab expandTaskId={expandTaskId} />}
        {tab === "habits" && <HabitsTab />}
        {tab === "solat" && <SolatTab />}
        {tab === "settings" && <SettingsTab />}
      </main>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-w-md items-center gap-0.5 rounded-full border border-border bg-surface/85 p-1.5 shadow-e3 backdrop-blur-xl">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => navigate(t.value)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-full py-2",
                  "transition-[background-color,color] duration-200 active:scale-95",
                  active ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="h-[1.15rem] w-[1.15rem]" />
                <span className="text-[0.625rem] font-semibold leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {celebrating && <SuccessCelebration taskText={celebrating} onDone={() => setCelebrating(null)} />}
    </div>
  );
}
