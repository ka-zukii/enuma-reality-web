import {
  useEffect,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useServerReady } from "@/lib/serverHealth";

// Durasi minimum layar loading tampil, supaya tidak berkedip
// ketika aset sudah termuat sangat cepat.
const MIN_DISPLAY_MS = 8000;

const TITLE = "Enuma Technology";
/** Huruf ke-6 dan seterusnya ("Technology") berwarna biru */
const TITLE_ACCENT_START = 6;

/** Tinggi siluet gedung dalam persen dari tinggi layar (relatif, 0..100) */
const SKYLINE = [38, 62, 46, 80, 54, 92, 60, 74, 42];

const STATUS_STEPS: { until: number; text: string }[] = [
  { until: 35, text: "Menyiapkan kota..." },
  { until: 70, text: "Memuat gedung dan jalan..." },
  { until: 95, text: "Menghubungkan ke server..." },
  { until: 101, text: "Hampir siap..." },
];

function statusFor(percent: number): string {
  const step = STATUS_STEPS.find((s) => percent < s.until);
  return (step ?? STATUS_STEPS[STATUS_STEPS.length - 1]).text;
}

/** Angka semu yang stabil (tidak berubah tiap render), dipakai untuk posisi partikel */
function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${Math.round(seeded(i + 1) * 100)}%`,
  size: 4 + Math.round(seeded(i + 7) * 8),
  duration: 6 + seeded(i + 3) * 6,
  delay: seeded(i + 11) * 5,
}));

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.35 } },
};

const letter = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/** Lapisan yang bergeser mengikuti pointer. Makin besar depth, makin jauh gerakannya (efek kedalaman). */
function ParallaxLayer({
  mx,
  my,
  depth,
  className = "",
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  className?: string;
  children?: ReactNode;
}) {
  const x = useTransform(mx, [-1, 1], [-depth, depth]);
  const y = useTransform(my, [-1, 1], [-depth, depth]);

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ x, y }}
    >
      {children}
    </motion.div>
  );
}

export default function LoadingScreen({ onDone }: { onDone?: () => void }) {
  const { active, progress, total } = useProgress();
  const reduce = useReducedMotion();

  // Progres semu hanya dipakai saat belum ada aset yang terdaftar (total === 0).
  const [fallback, setFallback] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible, setVisible] = useState(true);

  // Posisi pointer dinormalisasi ke -1..1, lalu dihaluskan dengan spring
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / MIN_DISPLAY_MS);
      setFallback(Math.round(p * 100));
      if (p >= 1) {
        window.clearInterval(id);
        setMinElapsed(true);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  // Layar baru selesai setelah aset termuat DAN server menjawab /health
  const { ready: serverReady, slow: serverSlow } = useServerReady();
  const assetsReady = total === 0 || (!active && progress >= 100);
  const assetPercent = total === 0 ? fallback : Math.min(100, Math.round(progress));
  // Selama server belum siap, progres tertahan di 95% agar tidak terlihat sudah selesai
  const percent = serverReady ? assetPercent : Math.min(assetPercent, 95);
  const ready = minElapsed && assetsReady && serverReady;
  const waitingServer = assetsReady && !serverReady;
  const statusText = waitingServer
    ? serverSlow
      ? "Server sedang dinyalakan, mohon tunggu..."
      : "Menghubungkan ke server..."
    : statusFor(percent);
  const ratio = Math.min(1, percent / 100);

  useEffect(() => {
    if (ready) setVisible(false);
  }, [ready]);

  const handlePointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="loading"
          onPointerMove={handlePointer}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, #ffffff 0%, #c7d7fb 45%, #2563eb 100%)",
          }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Lapis 1 (paling jauh): cahaya lembut */}
          <ParallaxLayer mx={mx} my={my} depth={reduce ? 0 : 36}>
            <motion.div
              className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl"
              animate={
                reduce
                  ? undefined
                  : { scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }
              }
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-blue-300/50 blur-3xl"
              animate={
                reduce
                  ? undefined
                  : { scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }
              }
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </ParallaxLayer>

          {/* Lapis 2: bentuk geometris yang berputar dan mengapung */}
          <ParallaxLayer mx={mx} my={my} depth={reduce ? 0 : 22}>
            <motion.div
              className="absolute left-[12%] top-[18%] h-10 w-10 rounded-xl border-2 border-white/60"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute right-[14%] top-[24%] h-6 w-6 rounded-full bg-white/70"
              animate={reduce ? undefined : { y: [0, -14, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-[20%] bottom-[30%] h-5 w-5 bg-blue-500/40"
              animate={reduce ? undefined : { rotate: [45, 225, 45] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[22%] bottom-[38%] h-14 w-14 rounded-2xl border-2 border-blue-500/30"
              animate={reduce ? undefined : { rotate: -360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            />
          </ParallaxLayer>

          {/* Lapis 3: partikel yang naik perlahan */}
          <ParallaxLayer mx={mx} my={my} depth={reduce ? 0 : 12}>
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute bottom-0 rounded-full bg-white/80"
                style={{ left: p.left, width: p.size, height: p.size }}
                animate={
                  reduce
                    ? undefined
                    : { y: ["0vh", "-110vh"], opacity: [0, 0.9, 0] }
                }
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </ParallaxLayer>

          {/* Lapis 4 (paling dekat): siluet gedung yang tumbuh mengikuti progres & bergerak seperti wave */}
          <ParallaxLayer
            mx={mx}
            my={my}
            depth={reduce ? 0 : 8}
            className="flex items-end justify-center gap-2 px-6 pb-0"
          >
            {SKYLINE.map((h, i) => (
              <motion.div
                key={i}
                className="w-[7%] max-w-8.5 origin-bottom"
                initial={{ height: "4%" }}
                animate={{
                  height: `${(h * 0.38 * (0.2 + 0.8 * ratio)).toFixed(2)}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
              >
                <motion.div
                  className="h-full w-full origin-bottom rounded-t-md bg-linear-to-t from-blue-700/60 to-blue-400/40"
                  animate={reduce ? undefined : { scaleY: [0.55, 1.15, 0.55] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.14,
                  }}
                />
              </motion.div>
            ))}
          </ParallaxLayer>

          {/* Konten utama di depan semua lapis */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo: masuk dengan spring, lalu mengapung pelan */}
            <motion.div
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-6 rounded-full bg-white/60 blur-xl"
                  animate={
                    reduce
                      ? undefined
                      : { scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }
                  }
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.img
                  src="/logo-enuma.png"
                  alt="Enuma"
                  className="relative h-12 w-12 object-contain sm:h-14 sm:w-14"
                  initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                />
              </div>
            </motion.div>

            {/* Judul: huruf muncul satu per satu */}
            <motion.p
              className="mt-4 text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
              variants={container}
              initial="hidden"
              animate="show"
              aria-label={TITLE}
            >
              {TITLE.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  variants={letter}
                  className={`inline-block ${i >= TITLE_ACCENT_START ? "text-blue-600" : ""}`}
                >
                  {ch === " " ? "\u00a0" : ch}
                </motion.span>
              ))}
            </motion.p>

            {/* Bar progres dengan kilau yang bergerak */}
            <div className="mt-6 w-full max-w-60 px-6">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
                <motion.div
                  className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-blue-500 to-indigo-600"
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {!reduce && (
                    <motion.div
                      className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/70 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "300%" }}
                      transition={{
                        duration: 1.3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                </motion.div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs font-medium tabular-nums text-blue-700">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statusText}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-blue-800/80"
                  >
                    {statusText}
                  </motion.span>
                </AnimatePresence>
                <span>{percent}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
