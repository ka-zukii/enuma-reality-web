import { useState } from "react";
import { AlertCircle, ArrowUpRight, Compass, Loader2, X } from "lucide-react";
import { signInAsGuest, type Gender } from "@/lib/guest";

interface GuestJoinModalProps {
  onClose: () => void;
}

const COMPANY_URL = import.meta.env.VITE_COMPANY_URL as string | undefined;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

export function GuestJoinModal({ onClose }: GuestJoinModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (anonymous: boolean) => {
    setError(null);
    setLoading(true);
    try {
      await signInAsGuest(anonymous ? {} : { name, gender });
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
        className="relative w-full max-w-[560px] rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl text-slate-900"
      >
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Jelajahi Enuma
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="guest-join-title" className="mt-5 text-3xl font-extrabold">
          Siapa nama Anda?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Nama ini tampil di atas karakter dan dapat dilihat pengunjung lain.
          Boleh dikosongkan.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <label htmlFor="guest-name" className="text-sm font-bold">
            Nama panggilan
          </label>
          <span className="text-xs text-slate-400">Opsional</span>
        </div>
        <input
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Contoh: Bintang"
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-base outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        <p className="mt-5 text-sm font-bold">Gender</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((opt) => {
            const active = gender === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={loading}
                onClick={() => setGender(active ? null : opt.value)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
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

        {COMPANY_URL && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-bold">Kenali Enuma lebih dekat</p>
              <p className="text-xs text-slate-500">
                Riset, produk digital, dan mentoring.
              </p>
            </div>
            <a
              href={COMPANY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-50 transition"
            >
              Kunjungi <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-xs text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={() => join(false)}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Compass className="h-4 w-4" />
          )}
          Mulai menjelajah
        </button>
        <button
          onClick={() => join(true)}
          disabled={loading}
          className="mt-3 w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          Anonim
        </button>
      </div>
    </div>
  );
}