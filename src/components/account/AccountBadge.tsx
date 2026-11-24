// Badge akun di pojok kiri bawah + pengaturan profil (nama & karakter) untuk akun yang login.
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, LogOut, Loader2, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Character = "karakter_1" | "karakter_2";

const GENDER_OPTIONS: { label: string; character: Character }[] = [
  { label: "Laki-laki", character: "karakter_1" },
  { label: "Perempuan", character: "karakter_2" },
];

function displayName(session: Session): string {
  const meta = session.user.user_metadata ?? {};
  return (
    (meta.full_name as string | undefined)?.trim() ||
    session.user.email?.split("@")[0] ||
    "Tamu"
  );
}

/** position: "landing" = kanan atas; "game" = kanan atas di bawah baris kontrol HUD */
export function AccountBadge({
  session,
  position = "landing",
  hidden = false,
}: {
  session: Session | null;
  position?: "landing" | "game";
  /** true = badge disembunyikan (mengikuti tombol sembunyikan navigasi) */
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!session) return null;

  const isGuest = !!session.user.is_anonymous;
  const name = displayName(session);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <>
      {!hidden && (
      <div
        className={`pointer-events-auto absolute right-3 z-40 flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 shadow-lg backdrop-blur sm:right-4 ${
          position === "game" ? "top-[64px]" : "top-3 sm:top-4"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white">
          {initials}
        </span>
        <div className="max-w-[160px] leading-tight">
          <p className="truncate text-xs font-bold text-slate-900">{name}</p>
          <p className="text-[10px] text-slate-500">
            {isGuest ? "Tamu" : "Sudah login"}
          </p>
        </div>
        {!isGuest && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Ubah profil"
            title="Ubah profil"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      )}

      {open && <ProfileModal session={session} onClose={() => setOpen(false)} />}
    </>
  );
}

function ProfileModal({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const meta = session.user.user_metadata ?? {};
  const [name, setName] = useState(displayName(session));
  const [character, setCharacter] = useState<Character>(
    (meta.character as Character | undefined) ?? "karakter_1",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const clean = name.trim().slice(0, 20);
    if (!clean) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: clean, character },
    });
    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }
    // Muat ulang sesi supaya nama & karakter baru ikut terbawa
    await supabase.auth.refreshSession();
    setSaving(false);
    setSaved(true);
    window.setTimeout(onClose, 800);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px] select-text">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-3xl bg-white p-6 text-slate-900 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-extrabold">Ubah profil</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label htmlFor="profile-name" className="mt-5 block text-sm font-bold">
          Nama panggilan
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          disabled={saving}
          placeholder="Contoh: Bintang"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        <p className="mt-5 text-sm font-bold">Karakter</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((opt) => {
            const active = character === opt.character;
            return (
              <button
                key={opt.character}
                type="button"
                disabled={saving}
                onClick={() => setCharacter(opt.character)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  active
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-xs text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={() => void save()}
          disabled={saving || saved}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? "Tersimpan" : "Simpan"}
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Nama dan karakter baru tampil ke pemain lain setelah kamu masuk ulang ke ruangan.
        </p>

        <button
          onClick={() => void supabase.auth.signOut().then(onClose)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Keluar dari akun
        </button>
      </div>
    </div>
  );
}