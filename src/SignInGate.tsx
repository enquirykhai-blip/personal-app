import { useState } from "react";
import { signInWithGoogle } from "./firebase";
import { Button } from "./ui";

/** Shown once, on the first launch with cloud sync configured — a real choice
    instead of a silent anonymous sign-in, without forcing an account. */
export default function SignInGate({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onDone();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(
        code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
          ? "Log masuk dibatalkan."
          : "Log masuk gagal. Cuba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg px-6 text-center">
      <div>
        <p className="text-overline uppercase text-ink-3">My Space</p>
        <h1 className="mt-1 text-display text-ink">Selamat datang</h1>
        <p className="mx-auto mt-2 max-w-xs text-body text-ink-2">
          Log masuk untuk sync data merentasi peranti, atau teruskan tanpa akaun — data anda tetap peribadi dan
          selamat.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <Button variant="brand" onClick={handleGoogle} disabled={busy} className="w-full">
          {busy ? "Membuka…" : "Log masuk dengan Google"}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={busy} className="w-full">
          Teruskan sebagai tetamu
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      )}

      <p className="max-w-xs text-caption text-ink-3">Boleh log masuk dengan Google bila-bila masa dalam Tetapan.</p>
    </div>
  );
}
