import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Character } from "@/lib/guest";

interface LoginModalProps {
  /** Kembali ke formulir nama tamu */
  onBack: () => void;
  onClose: () => void;
}

type Mode = "login" | "register";

const MAX_NAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 6;

const GENDER_OPTIONS: { label: string; character: Character }[] = [
  { label: "Laki-laki", character: "karakter_1" },
  { label: "Perempuan", character: "karakter_2" },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Email atau kata sandi salah.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  }
  if (/already registered|already been registered/i.test(message)) {
    return "Email ini sudah terdaftar. Silakan masuk.";
  }
  if (/password should be at least/i.test(message)) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (/rate limit|too many/i.test(message)) {
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  }
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return "Login Google belum diaktifkan di server.";
  }
  if (/failed to fetch|network/i.test(message)) {
    return "Tidak bisa terhubung ke server. Periksa koneksi Anda.";
  }
  return message || "Terjadi kesalahan. Coba lagi.";
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.38l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  onEnter,
  show,
  onToggleShow,
  disabled,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  show: boolean;
  onToggleShow: () => void;
  disabled: boolean;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <>
      <label htmlFor={id} className="mt-4 block text-xs font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:text-slate-700 cursor-pointer"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </>
  );
}

export function LoginModal({ onBack, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [character, setCharacter] = useState<Character>("karakter_1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = loading || googleLoading;
  const isRegister = mode === "register";
  const cleanName = name.trim();

  const canSubmit = isRegister
    ? cleanName.length > 0 &&
      email.trim().length > 0 &&
      password.length >= MIN_PASSWORD_LENGTH &&
      confirm.length > 0 &&
      !busy
    : email.trim().length > 0 && password.length > 0 && !busy;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirm("");
    setShowPassword(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setNotice(null);

    if (isRegister && password !== confirm) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);

    if (!isRegister) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(friendlyError(authError.message));
        setLoading(false);
      }
      // Bila berhasil, session terbentuk dan App otomatis masuk ke mode jelajah
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: cleanName, character } },
    });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    // Email sudah terdaftar: Supabase mengembalikan user tanpa identitas
    if (data.user && data.user.identities?.length === 0) {
      setError("Email ini sudah terdaftar. Silakan masuk.");
      setLoading(false);
      return;
    }

    // Bila konfirmasi email aktif, session belum ada sampai email dikonfirmasi
    if (!data.session) {
      switchMode("login");
      setNotice("Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.");
      setLoading(false);
    }
    // Bila session langsung ada, App otomatis masuk ke mode jelajah
  };

  const signInWithGoogle = async () => {
    setError(null);
    setNotice(null);
    setGoogleLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      setError(friendlyError(authError.message));
      setGoogleLoading(false);
    }
    // Bila berhasil, browser dialihkan ke Google lalu kembali ke halaman ini
  };

  const onEnter = () => void submit();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] select-text">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-[420px] overflow-y-auto rounded-[22px] bg-white p-5 sm:p-6 shadow-2xl text-slate-900"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </button>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="login-title" className="mt-4 text-2xl font-extrabold">
          {isRegister ? "Buat akun baru" : "Masuk ke akun Anda"}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {isRegister
            ? "Daftar untuk masuk sebagai anggota dan menyimpan profil Anda."
            : "Gunakan akun Enuma untuk masuk sebagai anggota."}
        </p>

        {/* Login dengan Google (otomatis membuat akun bila belum ada) */}
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          Lanjutkan dengan Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[11px] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau dengan email
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {isRegister && (
          <>
            <label htmlFor="reg-name" className="block text-xs font-bold">
              Nama panggilan
            </label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnter();
              }}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Contoh: Bintang"
              disabled={busy}
              className={inputClass}
            />

            <p className="mt-4 text-xs font-bold">Gender</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const active = character === opt.character;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={busy}
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
          </>
        )}

        <label
          htmlFor="auth-email"
          className={`block text-xs font-bold ${isRegister ? "mt-4" : ""}`}
        >
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          placeholder="nama@email.com"
          disabled={busy}
          className={inputClass}
        />

        <PasswordField
          id="auth-password"
          label="Kata sandi"
          value={password}
          onChange={setPassword}
          onEnter={onEnter}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
          disabled={busy}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={
            isRegister
              ? `Minimal ${MIN_PASSWORD_LENGTH} karakter`
              : "Masukkan kata sandi"
          }
        />

        {isRegister && (
          <PasswordField
            id="auth-confirm"
            label="Ulangi kata sandi"
            value={confirm}
            onChange={setConfirm}
            onEnter={onEnter}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            disabled={busy}
            autoComplete="new-password"
            placeholder="Ketik ulang kata sandi"
          />
        )}

        {notice && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-[11px] text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-[11px] text-rose-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={!canSubmit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRegister ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {isRegister ? "Daftar" : "Masuk"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            disabled={busy}
            className="font-bold text-blue-600 hover:text-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
        <button
          onClick={onBack}
          disabled={busy}
          className="mt-1 w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          Masuk sebagai tamu
        </button>
      </div>
    </div>
  );
}