import { useState } from "react";
import {
  Building2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Notice = { type: "error" | "success"; text: string } | null;

const inputClass =
  "w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const switchMode = () => {
    setIsRegister((prev) => !prev);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || email.split("@")[0] },
          },
        });

        if (error) {
          setNotice({ type: "error", text: error.message });
        } else {
          setNotice({
            type: "success",
            text: "Akun berhasil dibuat! Silakan masuk dengan akun kamu.",
          });
          setPassword("");
          setIsRegister(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setNotice({ type: "error", text: error.message });
        }
      }
    } catch {
      setNotice({
        type: "error",
        text: "Gagal terhubung ke server. Coba lagi beberapa saat.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-100 p-4 font-sans select-text">
      {/* Dekorasi latar yang cerah */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl space-y-5 text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Enuma Reality Project
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegister
                ? "Buat akun anggota baru"
                : "Masuk ke Virtual Workspace"}
            </p>
          </div>
        </div>

        {/* Notifikasi */}
        {notice && (
          <div
            role="alert"
            className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs ${
              notice.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {notice.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Field */}
        <div className="space-y-3">
          {isRegister && (
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nama Lengkap"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-10`}
              minLength={isRegister ? 6 : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {isRegister && (
            <p className="text-[11px] text-slate-400">
              Password minimal 6 karakter.
            </p>
          )}
        </div>

        {/* Tombol utama */}
        <button
          type="submit"
          disabled={loading}
          className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>{isRegister ? "Daftar Akun" : "Masuk Kantor"}</span>
              <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {/* Pindah mode */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-xs text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            {isRegister
              ? "Sudah punya akun? Masuk"
              : "Belum punya akun? Daftar sekarang"}
          </button>
        </div>
      </form>
    </div>
  );
}
