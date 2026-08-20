import { useState } from "react";
import { cx } from "./cx";
import { signInWithGoogle } from "./firebase";
import { Button } from "./ui";
import EmailAuthForm from "./EmailAuthForm";

/** Shown once, on the first launch with cloud sync configured — a real choice
    instead of a silent anonymous sign-in, without forcing an account. */
export default function SignInGate({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

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
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-bg px-6 py-12 text-center">
      <div className="m-auto flex w-full max-w-xs flex-col items-center gap-6">
        <div>
          <p className="text-overline uppercase text-ink-3">My Space</p>
          <h1 className="mt-1 text-display text-ink">Selamat datang</h1>
          <p className="mx-auto mt-2 max-w-xs text-body text-ink-2">
            Log masuk untuk sync data merentasi peranti, atau teruskan tanpa akaun — data anda tetap peribadi dan
            selamat.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Button variant="brand" onClick={handleGoogle} disabled={busy} className="w-full">
            {busy ? "Membuka…" : "Log masuk dengan Google"}
          </Button>
          <Button variant="secondary" onClick={onDone} disabled={busy} className="w-full">
            Teruskan sebagai tetamu
          </Button>
        </div>

        {!showEmail ? (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="text-caption font-semibold text-ink-3 underline underline-offset-2"
          >
            Guna email &amp; kata laluan sebaliknya
          </button>
        ) : (
          <div className={cx("w-full animate-rise border-t border-border pt-5")}>
            <EmailAuthForm initialMode="signup" onSuccess={onDone} />
          </div>
        )}

        {error && (
          <p role="alert" className="text-caption font-medium text-danger">
            {error}
          </p>
        )}

        <p className="max-w-xs text-caption text-ink-3">
          Boleh tukar kaedah log masuk bila-bila masa dalam Tetapan.
        </p>
      </div>
    </div>
  );
}
