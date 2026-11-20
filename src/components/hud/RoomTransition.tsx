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
const DOOR_OPEN_S = 0.55;

const PANEL_PATTERN = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 12px, transparent 12px 24px)",
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
      transition: { duration: DOOR_OPEN_S, ease: "easeInOut" },
    },
    shown: {
      x: "0%",
      transition: { duration: DOOR_CLOSE_S, ease: "easeInOut" },
    },
  };
}

/** Kartu di tengah: muncul setelah pintu tertutup */
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.18 },
  },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, delay: DOOR_CLOSE_S - 0.05 },
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
            reduce ? undefined : { opacity: [0.2, 1, 0.2], y: [0, -2, 0] }
          }
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
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
          className="pointer-events-auto absolute inset-0 z-60 overflow-hidden"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          {/* Dua daun pintu */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-br from-blue-600 to-indigo-700 shadow-[0_0_48px_rgba(37,99,235,0.45)]"
            style={PANEL_PATTERN}
            variants={panelVariants("left", reduce)}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-bl from-blue-600 to-indigo-700 shadow-[0_0_48px_rgba(37,99,235,0.45)]"
            style={PANEL_PATTERN}
            variants={panelVariants("right", reduce)}
          />

          {/* Kartu informasi di tengah */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            variants={cardVariants}
          >
            <div className="flex flex-col items-center text-center text-white">
              <div className="relative flex h-20 w-20 items-center justify-center">
                {/* Cincin putus-putus yang berputar pelan */}
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-dashed border-white/50"
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                {/* Busur yang berputar lebih cepat */}
                <motion.span
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-white"
                  animate={reduce ? undefined : { rotate: -360 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 14,
                    delay: DOOR_CLOSE_S,
                  }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </motion.div>
              </div>

              <p className="mt-5 text-sm font-semibold tracking-wide">
                Memuat ruangan
                <Dots reduce={reduce} />
              </p>
              <p className="mt-1 text-xs text-white/70">Menuju {destination}</p>

              {/* Bar tak tentu: kilau bergerak dari kiri ke kanan */}
              <div className="mt-4 h-1 w-44 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full w-2/5 rounded-full bg-white"
                  animate={reduce ? undefined : { x: ["-100%", "250%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
