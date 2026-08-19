import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Habit, PrayerLog, Task } from "./types";
import { firebaseEnabled, pushState, startAuth, subscribeToState } from "./firebase";
import { AppDataContext, type AppData, type SyncStatus } from "./appData";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private-mode failure: the in-memory state is still correct.
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasksState] = useState<Task[]>(() => readLocal<Task[]>("tasks", []));
  const [habits, setHabitsState] = useState<Habit[]>(() => readLocal<Habit[]>("habits", []));
  const [prayers, setPrayersState] = useState<PrayerLog>(() => readLocal<PrayerLog>("prayers", {}));

  const [uid, setUid] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncStatus>(firebaseEnabled ? "connecting" : "off");

  /* Writes we originate must not be echoed back as remote changes. */
  const applyingRemote = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ tasks, habits, prayers });

  /* Gives the debounced push and the seed path access to the newest state
     without re-creating them on every keystroke. */
  useEffect(() => {
    latest.current = { tasks, habits, prayers };
  }, [tasks, habits, prayers]);

  useEffect(() => writeLocal("tasks", tasks), [tasks]);
  useEffect(() => writeLocal("habits", habits), [habits]);
  useEffect(() => writeLocal("prayers", prayers), [prayers]);

  /* --- Auth --- */
  useEffect(() => {
    if (!firebaseEnabled) return;
    let stop: (() => void) | undefined;
    startAuth((user) => {
      setUid(user?.uid ?? null);
      setIsAnonymous(user?.isAnonymous ?? true);
      setAccountLabel(user && !user.isAnonymous ? (user.displayName ?? user.email) : null);
      if (!user) setSync("error");
    })
      .then((fn) => {
        stop = fn;
      })
      .catch(() => setSync("error"));
    return () => stop?.();
  }, []);

  /* --- Pull: remote is the source of truth once it exists --- */
  useEffect(() => {
    if (!firebaseEnabled || !uid) return;
    let stop: (() => void) | undefined;
    subscribeToState(uid, (state) => {
      if (state) {
        applyingRemote.current = true;
        if (Array.isArray(state.tasks)) setTasksState(state.tasks as Task[]);
        if (Array.isArray(state.habits)) setHabitsState(state.habits as Habit[]);
        if (state.prayers && typeof state.prayers === "object") setPrayersState(state.prayers as PrayerLog);
        setSync("synced");
        // Release on the next tick, after the state updates have flushed.
        setTimeout(() => {
          applyingRemote.current = false;
        }, 0);
      } else {
        // First run for this account: seed the cloud from whatever is local.
        const { tasks: t, habits: h, prayers: p } = latest.current;
        pushState(uid, { tasks: t, habits: h, prayers: p })
          .then(() => setSync("synced"))
          .catch(() => setSync("error"));
      }
    })
      .then((fn) => {
        stop = fn;
      })
      .catch(() => setSync("error"));
    return () => stop?.();
  }, [uid]);

  /* --- Push: debounced so a burst of edits is one write --- */
  const schedulePush = useCallback(() => {
    if (!firebaseEnabled || !uid || applyingRemote.current) return;
    setSync("saving");
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      const { tasks: t, habits: h, prayers: p } = latest.current;
      pushState(uid, { tasks: t, habits: h, prayers: p })
        .then(() => setSync("synced"))
        .catch(() => setSync("error"));
    }, 700);
  }, [uid]);

  const setTasks = useCallback(
    (update: (prev: Task[]) => Task[]) => {
      setTasksState((prev) => update(prev));
      schedulePush();
    },
    [schedulePush],
  );
  const setHabits = useCallback(
    (update: (prev: Habit[]) => Habit[]) => {
      setHabitsState((prev) => update(prev));
      schedulePush();
    },
    [schedulePush],
  );
  const setPrayers = useCallback(
    (update: (prev: PrayerLog) => PrayerLog) => {
      setPrayersState((prev) => update(prev));
      schedulePush();
    },
    [schedulePush],
  );

  const value = useMemo<AppData>(
    () => ({ tasks, habits, prayers, setTasks, setHabits, setPrayers, sync, isAnonymous, accountLabel }),
    [tasks, habits, prayers, setTasks, setHabits, setPrayers, sync, isAnonymous, accountLabel],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
