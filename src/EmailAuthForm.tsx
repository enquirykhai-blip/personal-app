import { useState } from "react";
import { resetPassword, signInWithEmail, signUpWithEmail } from "./firebase";
import { Button, TextField } from "./ui";

function errorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/email-already-in-use") return "Email ini dah didaftarkan. Cuba log masuk sebaliknya.";
  if (code === "auth/invalid-email") return "Format email tidak sah.";
  if (code === "auth/weak-password") return "Kata laluan terlalu pendek — sekurang-kurangnya 6 aksara.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email atau kata laluan salah.";
  }
  if (code === "auth/too-many-requests") return "Terlalu banyak percubaan. Cuba lagi sebentar.";
  return "Gagal. Cuba lagi.";
}

export default function EmailAuthForm({
  initialMode = "signup",
  onSuccess,
}: {
  initialMode?: "signup" | "login";
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
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
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
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
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        minLength={6}
        required
        className="h-11 text-label"
      />

      <Button type="submit" variant="secondary" disabled={busy || !email.trim() || !password} className="w-full">
        {busy ? "Sila tunggu…" : mode === "signup" ? "Daftar dengan email" : "Log masuk dengan email"}
      </Button>

      <div className="flex items-center justify-between text-caption">
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {mode === "signup" ? "Dah ada akaun? Log masuk" : "Belum ada akaun? Daftar"}
        </button>
        {mode === "login" && (
          <button type="button" onClick={handleForgotPassword} className="text-ink-3 underline underline-offset-2">
            Lupa kata laluan?
          </button>
        )}
      </div>

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
