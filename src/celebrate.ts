/** Tiny pub/sub so any tab can trigger the success celebration, which is
    rendered once at the App root (so it isn't torn down by tab switches). */
type Listener = (taskText: string) => void;

let listener: Listener | null = null;

export function onCelebrate(cb: Listener): () => void {
  listener = cb;
  return () => {
    if (listener === cb) listener = null;
  };
}

export function celebrateTaskDone(taskText: string) {
  listener?.(taskText);
}
