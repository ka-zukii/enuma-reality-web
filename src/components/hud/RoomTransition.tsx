import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Building2, MapPin } from "lucide-react";

interface RoomTransitionProps {
  /** true selama pindah ruangan berlangsung */
  active: boolean;
  /** Nama tujuan, mis. "Gedung Kantor" atau "Kota Enuma" */
  destination: string;
  /** true jika tujuannya kota (ikon peta), false jika gedung */
  toCity?: boolean;
}

const DOOR_CLOSE_S = 0.45;
const DOOR_OPEN_S = 0.65;
const WAVE_BARS = [0.45, 0.75, 1, 0.75, 0.45];

const PANEL_PATTERN = {
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 12px, transparent 12px 24px)",
  backgroundSize: "24px 24px, auto",
};

/** Panel kiri dan kanan meluncur dari tepi untuk "menutup pintu", lalu keluar lagi */
function panelVariants(side: "left" | "right", reduce: boolean): Variants {
  if (reduce) {
    return {
      hidden: { opacity: 0, transition: { duration: 0.2 } },
      shown: { opacity: 1, transition: { duration: 0.2 } },
    };
  }

  const offscreen = side === "left" ? "-100%" : "100%";
  return {
    hidden: {
      x: offscreen,
      transition: { duration: DOOR_OPEN_S, ease: [0.65, 0, 0.35, 1] },
    },
    shown: {
      x: "0%",
      transition: { duration: DOOR_CLOSE_S, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

/** Kartu di tengah: muncul setelah pintu tertutup */
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 8,
    transition: { duration: 0.2 },
  },
  shown: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, delay: DOOR_CLOSE_S - 0.08, ease: "easeOut" },
  },
};

/** Tiga titik yang berdenyut bergantian */
function Dots({ reduce }: { reduce: boolean }) {
  return (
    <span className="inline-flex w-4 justify-start">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={
            reduce ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }
          }
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.16,
            ease: "easeInOut",
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

export function RoomTransition({
  active,
  destination,
  toCity = false,
}: RoomTransitionProps) {
  const reduce = !!useReducedMotion();
  const Icon = toCity ? MapPin : Building2;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="room-transition"
          role="status"
          aria-live="polite"
          className="pointer-events-auto fixed inset-0 z-60 overflow-hidden"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          {/* Dua daun pintu: menutup ke tengah lalu bergeser membuka */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-white/25 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800"
            style={PANEL_PATTERN}
            variants={panelVariants("left", reduce)}
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-linear-to-b from-white/0 via-white/50 to-white/0" />
          </motion.div>

          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-white/25 bg-linear-to-bl from-blue-600 via-blue-700 to-indigo-800"
            style={PANEL_PATTERN}
            variants={panelVariants("right", reduce)}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-linear-to-b from-white/0 via-white/50 to-white/0" />
          </motion.div>

          {/* Kartu informasi bersih dengan kontras tinggi di tengah */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-4"
            variants={cardVariants}
          >
            <div className="relative flex w-full max-w-xs flex-col items-center rounded-3xl border border-slate-200/80 bg-white px-7 py-7 text-center">
              {/* Ikon tujuan dengan cincin berputar */}
              <div className="relative flex h-20 w-20 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-dashed border-blue-200"
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.span
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 border-r-blue-400/60"
                  animate={reduce ? undefined : { rotate: -360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 14,
                    delay: DOOR_CLOSE_S - 0.05,
                  }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.9} />
                </motion.div>
              </div>

              {/* Badge arah tujuan */}
              <span className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {toCity ? "Kembali ke Kota" : "Memasuki Ruangan"}
              </span>

              <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
                {destination}
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Menyiapkan area
                <Dots reduce={reduce} />
              </p>

              {/* Indikator wave mini */}
              <div className="mt-5 flex h-5 items-end justify-center gap-1.5">
                {WAVE_BARS.map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 origin-bottom rounded-full bg-linear-to-t from-blue-600 to-sky-400"
                    style={{ height: `${Math.round(h * 18)}px` }}
                    animate={
                      reduce ? undefined : { scaleY: [0.45, 1.15, 0.45] }
                    }
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.12,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
