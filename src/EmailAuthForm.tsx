import { useState } from "react";
import { resetPassword, signInWithEmail } from "./firebase";
import { Button, TextField } from "./ui";

function errorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/invalid-email") return "Format email tidak sah.";
  if (code === "auth/weak-password") return "Kata laluan terlalu pendek — sekurang-kurangnya 6 aksara.";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Email atau kata laluan salah.";
  }
  if (code === "auth/too-many-requests") return "Terlalu banyak percubaan. Cuba lagi sebentar.";
  return "Gagal. Cuba lagi.";
}

/** One email/password field pair, one action: sign in. The account is
    created automatically the first time — no separate register step. */
export default function EmailAuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Masukkan email dahulu untuk hantar pautan set semula.");
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await resetPassword(trimmed);
      setNotice("Pautan set semula kata laluan dihantar ke email anda.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 text-left">
      <TextField
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
        className="h-11 text-label"
      />
      <TextField
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Kata laluan"
        aria-label="Kata laluan"
        autoComplete="current-password"
        minLength={6}
        required
        className="h-11 text-label"
      />

      <Button type="submit" variant="secondary" disabled={busy || !email.trim() || !password} className="w-full">
        {busy ? "Sila tunggu…" : "Log masuk"}
      </Button>

      <button
        type="button"
        onClick={handleForgotPassword}
        className="self-end text-caption text-ink-3 underline underline-offset-2"
      >
        Lupa kata laluan?
      </button>

      {error && (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-caption font-medium text-ink">
          {notice}
        </p>
      )}
    </form>
  );
}
