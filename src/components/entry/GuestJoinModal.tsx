import { useState } from "react";
import { AlertCircle, Compass, Loader2, X } from "lucide-react";
import { startAsGuest, type Character } from "@/lib/guest";

interface GuestJoinModalProps {
  onClose: () => void;
  /** Dipanggil saat tombol Login ditekan. Alur login belum ditentukan. */
  onLogin?: () => void;
}

const MAX_NAME_LENGTH = 20;

/** Gender ditampilkan ke pengguna, lalu dipetakan ke karakter yang dibaca backend */
const GENDER_OPTIONS: { label: string; character: Character }[] = [
  { label: "Laki-laki", character: "karakter_1" },
  { label: "Perempuan", character: "karakter_2" },
];

export function GuestJoinModal({ onClose, onLogin }: GuestJoinModalProps) {
  const [name, setName] = useState("");
  const [character, setCharacter] = useState<Character>("karakter_1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanName = name.trim();
  const canJoin = cleanName.length > 0 && !loading;

  const join = async () => {
    if (!cleanName) return;
    setError(null);
    setLoading(true);
    try {
      await startAsGuest(cleanName, character);
      // Setelah session terbentuk, App otomatis masuk ke mode jelajah
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] select-text">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-join-title"
        className="relative w-full max-w-[420px] rounded-[22px] bg-white p-5 sm:p-6 shadow-2xl text-slate-900"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
            <span className="h-1 w-1 rounded-full bg-blue-600" />
            Jelajahi Enuma
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="guest-join-title" className="mt-4 text-2xl font-extrabold">
          Siapa nama Anda?
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Nama ini tampil di atas karakter dan dapat dilihat pengunjung lain.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <label htmlFor="guest-name" className="text-xs font-bold">
            Nama panggilan
          </label>
          <span className="text-[15px] text-rose-500">*</span>
        </div>
        <input
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canJoin) void join();
          }}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Contoh: Bintang"
          disabled={loading}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        <p className="mt-4 text-xs font-bold">Gender</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map((opt) => {
            const active = character === opt.character;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={loading}
                onClick={() => setCharacter(opt.character)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
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
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-[11px] text-rose-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={() => void join()}
          disabled={!canJoin}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Compass className="h-4 w-4" />
          )}
          Mulai menjelajah
        </button>
        <button
          onClick={() => onLogin?.()}
          disabled={loading}
          className="mt-2 w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          Login
        </button>
      </div>
    </div>
  );
}