import { useEffect, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import type { LandingMenuKey } from "@/components/entry/LandingOverlay";

const STATS = [
  { value: "30+", label: "Produk & hasil riset dikembangkan" },
  { value: "5", label: "Spesialisasi teknologi" },
  { value: "24/7", label: "Layanan konsultasi & bimbingan" },
  { value: "10+", label: "Institusi & klien terpercaya" },
];

const TENTANG_POINTS = [
  "Tim peneliti dan teknisi berpengalaman lintas disiplin",
  "Pendampingan penuh, dari riset dan konsultasi hingga pemeliharaan",
  "Fokus pada kualitas, ketepatan waktu, dan hasil terukur",
];

const SERVICES = [
  {
    title: "Riset Teknologi",
    desc: "Kajian kebutuhan, studi kelayakan, eksperimen, dan purwarupa untuk memvalidasi ide teknologi Anda sebelum dikembangkan lebih jauh.",
  },
  {
    title: "Perancangan Sistem",
    desc: "Punya ide sistem yang kompleks? Kami menerjemahkannya menjadi arsitektur dan rancangan yang matang, terukur, dan siap dikembangkan.",
  },
  {
    title: "Pengembangan Produk",
    desc: "Hasil riset dan rancangan kami wujudkan menjadi produk digital berkualitas: aplikasi, web, game, hingga perangkat IoT dan robotika.",
  },
  {
    title: "Pengelolaan Produk",
    desc: "Produk yang baik butuh perawatan berkelanjutan. Kami menangani pemeliharaan, peningkatan, dan pengelolaan produk Anda secara menyeluruh.",
  },
  {
    title: "Mentoring & Pelatihan",
    desc: "Bimbingan intensif untuk pelajar, mahasiswa, hingga tim profesional: pelatihan, workshop, mentoring lomba, konsultasi project, serta pendampingan implementasi teknologi.",
  },
];

const PROJECTS = [
  {
    tag: "GAME",
    title: "Jawadwipa: The Legend of Ajisaka",
    desc: "Game pengenalan legenda Ajisaka",
    chips: ["Unity", "Game Design", "Ilustrasi"],
    image: "https://enumatechnology.com/images/portfolio/12.webp",
    url: "https://enumatechnology.com/portfolio/13",
  },
  {
    tag: "KIOSK",
    title: "Citilink Corner",
    desc: "Aplikasi sistem mesin kiosk Citilink Corner",
    chips: ["Kiosk", "Web App", "Touchscreen UI"],
    image: "https://enumatechnology.com/images/portfolio/5.webp",
    url: "https://enumatechnology.com/portfolio/5",
  },
  {
    tag: "MOBILE APP",
    title: "ASTERU",
    desc: "Aplikasi animasi pembelajaran Pancasila",
    chips: ["Android", "Unity", "Ilustrasi 2D"],
    image: "https://enumatechnology.com/images/portfolio/7.webp",
    url: "https://enumatechnology.com/portfolio/1",
  },
  {
    tag: "AUGMENTED REALITY",
    title: "Sol-AR",
    desc: "Aplikasi augmented reality pembelajaran tata surya",
    chips: ["Android", "ARCore", "Unity"],
    image: "https://enumatechnology.com/images/portfolio/2.webp",
    url: "https://enumatechnology.com/portfolio/2",
  },
];

const PORTFOLIO_URL = "https://enumatechnology.com/portfolio";

/** Kerangka bersama: pill judul, tombol tutup, dan footer */
function Shell({
  pill,
  onClose,
  footer,
  children,
}: {
  pill: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-wide text-blue-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          {pill}
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">{children}</div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 pt-3 text-[10px] font-semibold tracking-wider text-slate-500">
        {footer}
      </div>
    </>
  );
}

function TentangKami({ onClose }: { onClose: () => void }) {
  return (
    <Shell
      pill="Tentang Kami"
      onClose={onClose}
      footer={<span>EST. KARANGANYAR, ID</span>}
    >
      <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle,#eef4ff_0%,#ffffff_70%)]">
          <div className="flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-xl bg-white shadow-lg">
            <img src="/logo-enuma.png" alt="" className="h-8 w-8" />
            <p className="text-[8px] font-bold text-slate-900">
              Enuma Technology
            </p>
            <p className="text-[5px] tracking-widest text-slate-400">
              EST. KARANGANYAR, ID
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold tracking-widest text-blue-600">
            ENUMA TECHNOLOGY
          </p>
          <h2 className="mt-1.5 text-xl font-extrabold leading-tight text-slate-900">
            Meriset teknologi, mengembangkan produk, membimbing talenta
          </h2>
          <p className="mt-2 text-[10px] tracking-widest text-slate-500">
            SOFTWARE · IOT · ROBOTICS
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-slate-600">
        <p>
          Enuma Technology adalah perusahaan riset dan pengembangan teknologi.
          Kami menyediakan jasa penelitian, perancangan sistem, pengembangan,
          dan pengelolaan produk digital untuk membantu bisnis maupun institusi
          bertransformasi dengan solusi yang tepat guna.
        </p>
        <p>
          Kami juga aktif membimbing melalui mentoring, pelatihan, workshop,
          hingga pendampingan lomba dan implementasi teknologi. Puluhan produk,
          sistem, dan hasil riset telah kami kembangkan, dari aplikasi mobile,
          augmented reality, game, hingga mesin kiosk dan sistem IoT.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.value}
            className="rounded-xl bg-blue-50/60 p-3 text-center"
          >
            <p className="text-xl font-extrabold text-blue-600">{s.value}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {TENTANG_POINTS.map((p) => (
          <li
            key={p}
            className="flex items-center gap-2.5 text-[13px] font-medium text-slate-800"
          >
            <Check
              className="h-4 w-4 shrink-0 text-blue-600"
              strokeWidth={2.5}
            />
            {p}
          </li>
        ))}
      </ul>

      {/* TODO: arahkan ke halaman detail setelah konten diverifikasi */}
      <a
        href="https://enumatechnology.com/#about"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 block w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Lihat Detail
      </a>
    </Shell>
  );
}

function Layanan({ onClose }: { onClose: () => void }) {
  return (
    <Shell
      pill="Layanan / Jasa"
      onClose={onClose}
      footer={
        <>
          <span>SOFTWARE · IOT · ROBOTICS</span>
          <span className="text-blue-600">5 LAYANAN INTI</span>
        </>
      }
    >
      <h2 className="text-xl font-extrabold leading-tight text-slate-900">
        Layanan menyeluruh, dari riset hingga bimbingan
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
        Lima layanan inti yang saling melengkapi: meriset gagasan, mewujudkannya
        menjadi produk, dan menumbuhkan orang-orang di baliknya.
      </p>

      <ol className="mt-4 space-y-2">
        {SERVICES.map((s, i) => (
          <li
            key={s.title}
            className="group flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-3 transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600 transition duration-300 group-hover:rotate-6 group-hover:bg-blue-600 group-hover:text-white">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {s.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Portofolio({ onClose }: { onClose: () => void }) {
  return (
    <Shell
      pill="Portofolio"
      onClose={onClose}
      footer={
        <>
          <span>SOFTWARE · IOT · ROBOTICS</span>
          <span className="text-blue-600">
            Klik kartu untuk melihat detail ↗
          </span>
        </>
      }
    >
      <h2 className="text-xl font-extrabold leading-tight text-slate-900">
        Karya yang telah kami wujudkan
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
        Dari hasil riset dan produk digital hingga program pelatihan.
        <br />
        Inilah sebagian karya yang kami banggakan.
      </p>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        Riset & Pengembangan
      </h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
          >
            <div className="relative h-24 overflow-hidden bg-linear-to-br from-blue-50 to-slate-100">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Lapisan biru yang muncul saat hover */}
              <div className="absolute inset-0 bg-linear-to-t from-blue-900/70 via-blue-900/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold tracking-wide text-blue-600 shadow-sm transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                {p.tag}
              </span>

              {/* Tombol kecil di tengah yang muncul saat hover */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Lihat Detail →
              </span>
            </div>

            <div className="p-3">
              <p className="text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                {p.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{p.desc}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* TODO: arahkan ke daftar lengkap setelah halamannya dibuat */}
      <div className="mt-4 flex justify-center">
        <a
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer rounded-full bg-blue-600 px-6 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          Lihat Selengkapnya →
        </a>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Mentoring & Pelatihan
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Portofolio pelatihan, workshop, mentoring, konsultasi project, serta
            pendampingan implementasi teknologi akan segera ditampilkan.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-600">
          SEGERA HADIR
        </span>
      </div>
    </Shell>
  );
}

export function InfoModal({
  kind,
  onClose,
}: {
  kind: LandingMenuKey;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-150 max-h-[calc(100dvh-2rem)] overflow-y-auto select-text rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        {kind === "tentang" && <TentangKami onClose={onClose} />}
        {kind === "layanan" && <Layanan onClose={onClose} />}
        {kind === "portofolio" && <Portofolio onClose={onClose} />}
      </div>
    </div>
  );
}
