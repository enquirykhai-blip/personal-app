import { useRef, useState } from "react";
import { cx } from "./cx";
import { useAppData } from "./appData";
import { useLocalStorage } from "./useLocalStorage";
import { DEFAULT_OPENROUTER_MODEL, detectProvider } from "./ai";
import { firebaseEnabled, signInWithGoogle, signOut } from "./firebase";
import EmailAuthForm from "./EmailAuthForm";
import type { Habit, PrayerLog, Profile, Task } from "./types";
import { Button, Card, SectionHeader, TextField } from "./ui";

const SYNC_TEXT: Record<string, string> = {
  off: "Peranti ini sahaja",
  connecting: "Menyambung…",
  saving: "Menyimpan…",
  synced: "Tersimpan di cloud",
  error: "Sync gagal",
};

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

export default function SettingsTab() {
  const { profile, setProfile, tasks, habits, prayers, replaceAll, sync, isAnonymous, accountLabel } =
    useAppData();

  const [apiKey, setApiKey] = useLocalStorage("gemini_api_key", "");
  const [aiModel, setAiModel] = useLocalStorage("ai_model", DEFAULT_OPENROUTER_MODEL);

  const [nameDraft, setNameDraft] = useState(profile.name ?? "");
  const [keyDraft, setKeyDraft] = useState("");
  const [modelDraft, setModelDraft] = useState(aiModel);
  const [editingKey, setEditingKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const draftProvider = detectProvider(keyDraft);
  const activeProvider = apiKey ? (detectProvider(apiKey) === "openrouter" ? "OpenRouter" : "Gemini") : null;

  function saveName() {
    setProfile((prev) => ({ ...prev, name: nameDraft.trim() || undefined }));
    setNotice("Nama disimpan.");
  }

  function saveKey() {
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setAiModel(modelDraft.trim() || DEFAULT_OPENROUTER_MODEL);
    setKeyDraft("");
    setEditingKey(false);
    setNotice("API key disimpan dalam browser ini.");
  }

  function removeKey() {
    setApiKey("");
    setKeyDraft("");
    setEditingKey(false);
    setNotice("API key dipadam.");
  }

  async function handleSignIn() {
    setBusy(true);
    setNotice(null);
    try {
      await signInWithGoogle();
      setNotice("Berjaya log masuk.");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setNotice(
        code.includes("popup-blocked")
          ? "Popup disekat browser. Benarkan popup untuk laman ini."
          : code.includes("popup-closed")
            ? "Log masuk dibatalkan."
            : "Log masuk gagal. Cuba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, habits, prayers, profile }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-space-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Data dieksport.");
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      replaceAll({
        tasks: Array.isArray(parsed.tasks) ? (parsed.tasks as Task[]) : [],
        habits: Array.isArray(parsed.habits) ? (parsed.habits as Habit[]) : [],
        prayers: parsed.prayers && typeof parsed.prayers === "object" ? (parsed.prayers as PrayerLog) : {},
        profile: parsed.profile && typeof parsed.profile === "object" ? (parsed.profile as Profile) : {},
      });
      setNameDraft(parsed.profile?.name ?? "");
      setNotice("Data diimport.");
    } catch {
      setNotice("Fail tidak sah. Pastikan ia fail eksport dari app ini.");
    }
  }

  function wipe() {
    replaceAll({ tasks: [], habits: [], prayers: {}, profile: {} });
    setNameDraft("");
    setConfirmWipe(false);
    setNotice("Semua data dipadam.");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-display text-ink">Tetapan</h1>
        <p className="mt-0.5 text-caption text-ink-3">Profil, sync, AI, dan data</p>
      </header>

      {notice && (
        <p role="status" className="mb-4 rounded-field border border-ink bg-surface-2 px-3 py-2 text-caption font-medium text-ink">
          {notice}
        </p>
      )}

      {/* Profile */}
      <section className="mb-7">
        <SectionHeader title="Profil" />
        <Card className="p-3">
          <label htmlFor="set-name" className="text-caption font-medium text-ink-2">
            Nama panggilan
          </label>
          <div className="mt-1.5 flex gap-2">
            <TextField
              id="set-name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="cth: Khai"
              className="h-10 text-label"
            />
            <Button size="sm" onClick={saveName} disabled={nameDraft.trim() === (profile.name ?? "")}>
              Simpan
            </Button>
          </div>
          <p className="mt-1.5 text-caption text-ink-3">Digunakan pada sapaan di skrin Utama.</p>
        </Card>
      </section>

      {/* Storage & account */}
      <section className="mb-7">
        <SectionHeader title="Penyimpanan" />
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                sync === "synced" ? "bg-ink" : sync === "error" ? "bg-ink" : "bg-control",
                (sync === "saving" || sync === "connecting") && "animate-pulse",
              )}
            />
            <p className="text-label font-semibold text-ink">{SYNC_TEXT[sync] ?? SYNC_TEXT.off}</p>
          </div>

          {!firebaseEnabled ? (
            <p className="mt-1.5 text-caption text-ink-2">
              Data disimpan dalam browser ini sahaja. Ia hilang jika cache dikosongkan dan tidak muncul pada
              peranti lain. Sync cloud perlu config Firebase semasa build.
            </p>
          ) : isAnonymous ? (
            <>
              <p className="mt-1.5 text-caption text-ink-2">
                Data tersimpan di cloud dan terlindung, tetapi terikat pada browser ini. Log masuk untuk
                membukanya pada telefon dan komputer yang sama.
              </p>
              <Button size="sm" className="mt-2.5 w-full" onClick={handleSignIn} disabled={busy}>
                {busy ? "Membuka…" : "Log masuk dengan Google"}
              </Button>

              {!showEmailAuth ? (
                <button
                  type="button"
                  onClick={() => setShowEmailAuth(true)}
                  className="mt-2.5 text-caption font-semibold text-ink-3 underline underline-offset-2"
                >
                  Guna email &amp; kata laluan sebaliknya
                </button>
              ) : (
                <div className="mt-3 animate-rise border-t border-border pt-3">
                  <EmailAuthForm
                    initialMode="signup"
                    onSuccess={() => {
                      setShowEmailAuth(false);
                      setNotice("Berjaya log masuk.");
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mt-1.5 text-caption text-ink-2">
                Log masuk sebagai <span className="font-semibold text-ink">{accountLabel}</span>.
              </p>
              <Button variant="secondary" size="sm" className="mt-2.5 w-full" onClick={() => void signOut()}>
                Log keluar
              </Button>
            </>
          )}
        </Card>
      </section>

      {/* AI */}
      <section className="mb-7">
        <SectionHeader title="AI" />
        <Card className="p-3">
          {apiKey && !editingKey ? (
            <>
              <p className="text-label font-semibold text-ink">{activeProvider} tersambung</p>
              <p className="mt-0.5 font-mono text-caption text-ink-3">{maskKey(apiKey)}</p>
              {activeProvider === "OpenRouter" && (
                <p className="mt-1 text-caption text-ink-2">
                  Model: <span className="font-semibold text-ink">{aiModel}</span>
                </p>
              )}
              <div className="mt-2.5 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditingKey(true)}>
                  Tukar
                </Button>
                <Button variant="ghost" size="sm" onClick={removeKey}>
                  Padam key
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-caption text-ink-2">
                Tampal API key <strong className="font-semibold text-ink">Gemini</strong> atau{" "}
                <strong className="font-semibold text-ink">OpenRouter</strong> — jenisnya dikesan automatik. Key
                disimpan dalam browser ini sahaja dan tidak pernah dihantar ke mana-mana selain penyedia AI.
              </p>
              <div className="mt-2 flex gap-2">
                <TextField
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="API key"
                  aria-label="API key AI"
                  autoComplete="off"
                  className="h-10 text-label"
                />
                <Button size="sm" onClick={saveKey} disabled={!keyDraft.trim()}>
                  Simpan
                </Button>
              </div>

              {draftProvider === "openrouter" && (
                <div className="mt-2 animate-rise">
                  <label htmlFor="set-model" className="text-caption font-medium text-ink-2">
                    Model OpenRouter
                  </label>
                  <TextField
                    id="set-model"
                    value={modelDraft}
                    onChange={(e) => setModelDraft(e.target.value)}
                    placeholder={DEFAULT_OPENROUTER_MODEL}
                    className="mt-1 h-10 text-label"
                  />
                  <p className="mt-1 text-caption text-ink-3">
                    Tukar jika model ini tiada pada akaun anda —{" "}
                    <a
                      href="https://openrouter.ai/models"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-ink underline underline-offset-2"
                    >
                      senarai model
                    </a>
                    .
                  </p>
                </div>
              )}

              <p className="mt-2 text-caption text-ink-3">
                Dapatkan key:{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  Google AI Studio
                </a>{" "}
                ·{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  OpenRouter
                </a>
              </p>
              {editingKey && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditingKey(false)}>
                  Batal
                </Button>
              )}
            </>
          )}
        </Card>
      </section>

      {/* Data */}
      <section className="mb-7">
        <SectionHeader title="Data" />
        <Card className="p-3">
          <p className="text-caption text-ink-2">
            {tasks.length} tugasan · {habits.length} tabiat · {Object.keys(prayers).length} hari solat
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exportData}>
              Eksport JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-3 border-t border-border pt-3">
            {confirmWipe ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 text-caption font-semibold text-ink">
                  Padam semua tugasan, tabiat dan rekod solat? Tindakan ini tidak boleh dibatalkan.
                </p>
                <Button size="sm" onClick={wipe}>
                  Ya, padam
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmWipe(false)}>
                  Batal
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmWipe(true)}>
                Padam semua data
              </Button>
            )}
          </div>
        </Card>
      </section>

      <p className="pb-2 text-center text-caption text-ink-3">My Space — data peribadi, disimpan untuk anda.</p>
    </div>
  );
}
