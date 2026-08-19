import { useState } from "react";
import { cx } from "./cx";
import { useAppData } from "./appData";
import { firebaseEnabled, signInWithGoogle, signOut } from "./firebase";
import { Button, Card } from "./ui";

const DOT: Record<string, string> = {
  off: "bg-ink-3",
  connecting: "bg-warn animate-pulse",
  saving: "bg-warn animate-pulse",
  synced: "bg-brand-vivid",
  error: "bg-danger",
};

const LABEL: Record<string, string> = {
  off: "Peranti ini sahaja",
  connecting: "Menyambung…",
  saving: "Menyimpan…",
  synced: "Tersimpan di cloud",
  error: "Sync gagal",
};

export default function SyncBadge() {
  const { sync, isAnonymous, accountLabel } = useAppData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      setOpen(false);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
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

  const initials = accountLabel
    ? accountLabel
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "MS";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Status penyimpanan data"
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-label font-bold text-white transition-transform active:scale-95"
      >
        {initials}
        <span
          className={cx(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg",
            DOT[sync] ?? DOT.off,
          )}
        />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Tutup"
            onClick={() => setOpen(false)}
          />
          <Card className="absolute right-0 top-13 z-40 w-72 animate-rise p-3 shadow-e3">
            <div className="flex items-center gap-2">
              <span className={cx("h-2 w-2 rounded-full", DOT[sync] ?? DOT.off)} />
              <p className="text-label font-semibold text-ink">{LABEL[sync] ?? LABEL.off}</p>
            </div>

            {!firebaseEnabled ? (
              <p className="mt-1.5 text-caption text-ink-2">
                Data disimpan dalam browser ini sahaja. Ia akan hilang jika awak clear cache, dan tidak muncul
                pada peranti lain.
              </p>
            ) : isAnonymous ? (
              <>
                <p className="mt-1.5 text-caption text-ink-2">
                  Data awak dilindungi dan tersimpan di cloud, tetapi terikat pada browser ini. Log masuk untuk
                  membukanya pada telefon dan komputer yang sama.
                </p>
                <Button
                  variant="brand"
                  size="sm"
                  className="mt-2.5 w-full"
                  onClick={handleSignIn}
                  disabled={busy}
                >
                  {busy ? "Membuka…" : "Log masuk dengan Google"}
                </Button>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-caption text-ink-2">
                  Log masuk sebagai <span className="font-semibold text-ink">{accountLabel}</span>. Data awak
                  sama pada semua peranti.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5 w-full"
                  onClick={() => {
                    void signOut();
                    setOpen(false);
                  }}
                >
                  Log keluar
                </Button>
              </>
            )}

            {error && (
              <p role="alert" className="mt-2 text-caption font-medium text-danger">
                {error}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
