import { useState } from "react";
import { Link2, Mail, X } from "lucide-react";
import { CONTACT } from "@/config/enuma";
import { InstagramIcon, WhatsAppIcon } from "@/components/hud/brandIcons";

interface ExitModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const SHARE_TEXT = "Jelajahi kantor virtual Enuma Technology";

const shareBtn =
  "flex flex-col items-center gap-2 rounded-2xl border border-slate-300 bg-white px-2 py-3 text-xs font-bold text-slate-900 transition hover:border-blue-500 hover:bg-blue-50 cursor-pointer";

export function ExitModal({ onClose, onConfirm }: ExitModalProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const url = window.location.origin;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const copyLink = async (message = "Link tersalin") => {
    try {
      await navigator.clipboard.writeText(url);
      flash(message);
    } catch {
      flash("Gagal menyalin link");
    }
  };

  // Instagram tidak punya tautan "bagikan" untuk web: pakai menu bagikan HP
  // bila tersedia, kalau tidak, salin link supaya bisa ditempel di Instagram.
  const shareInstagram = async () => {
    if ("share" in navigator) {
      try {
        await navigator.share({ title: "Enuma Technology", text: SHARE_TEXT, url });
      } catch {
        /* dibatalkan pengguna */
      }
      return;
    }
    await copyLink("Link tersalin, tempel di Instagram");
  };

  const instagramUrl = CONTACT.instagram
    ? `https://instagram.com/${CONTACT.instagram}`
    : null;
  const emailHref = CONTACT.email
    ? `mailto:${CONTACT.email}`
    : CONTACT.website;
  const emailLabel = CONTACT.email ? "Tanya lewat email" : "Kunjungi website kami";

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px] select-text">
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[94vh] w-full max-w-[440px] overflow-y-auto rounded-3xl bg-white p-6 text-slate-900 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mt-5 pr-8 text-base font-extrabold">
          Terima kasih sudah berkunjung!
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Semoga kamu mendapat gambaran tentang Enuma Technology. Bagikan ke
          rekan atau kolegamu yang mungkin butuh solusi teknologi.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            className={shareBtn}
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
          <button onClick={shareInstagram} className={shareBtn}>
            <InstagramIcon />
            Instagram
          </button>
          <button onClick={() => copyLink()} className={shareBtn}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
              <Link2 className="h-5 w-5" />
            </span>
            Salin Link
          </button>
        </div>
        {notice && (
          <p className="mt-2 text-center text-xs font-semibold text-emerald-600">
            {notice}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-100 via-pink-100 to-fuchsia-100 p-3.5">
          <InstagramIcon className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold">Ikuti perkembangan Enuma</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Dapatkan kabar proyek dan inovasi terbaru kami.
            </p>
          </div>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Follow
            </a>
          ) : (
            <button
              disabled
              title="Akun Instagram belum diisi di config"
              className="shrink-0 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-bold text-white"
            >
              Follow
            </button>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 p-4">
          <p className="text-sm font-bold leading-snug">
            Punya ide proyek atau kebutuhan teknologi?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Aplikasi Android, sistem IoT, game, multimedia, atau robotika:
            ceritakan kebutuhanmu, tim kami siap berdiskusi.
          </p>
          <a
            href={emailHref}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold transition hover:border-blue-500 hover:text-blue-700"
          >
            <Mail className="h-4 w-4" />
            {emailLabel}
          </a>
        </div>

        <button
          onClick={onConfirm}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-200 py-3 text-sm font-bold transition hover:bg-slate-300 cursor-pointer"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}