import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface LoadingScreenProps {
  /** Dipanggil saat bar penuh; setelah itu layar memudar keluar */
  onFinish: () => void;
}

/** Lama bar berjalan dari 0 ke 100 (detik) */
const DURATION = 2.4;

export function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const progress = useMotionValue(0);
  const barWidth = useTransform(progress, (v) => `${v}%`);

  useEffect(() => {
    let timer: number | undefined;
    const controls = animate(progress, 100, {
      duration: DURATION,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        timer = window.setTimeout(onFinish, 250);
      },
    });
    return () => {
      controls.stop();
      if (timer) window.clearTimeout(timer);
    };
  }, [progress, onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-sans"
      style={{
        background:
          "radial-gradient(ellipse at 60% 58%, #ffffff 0%, #c4d4f8 38%, #2f66ea 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Logo: muncul membesar, lalu bergerak naik-turun pelan */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      >
        <motion.img
          src="/logo-enuma.png"
          alt="Enuma Technology"
          className="h-24 w-24 drop-shadow-xl sm:h-28 sm:w-28"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.h1
        className="mt-6 text-3xl font-bold text-black sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        Enuma <span className="text-blue-600">Technology</span>
      </motion.h1>

      <motion.div
        className="mt-8 h-[30px] w-[min(700px,80vw)] overflow-hidden rounded-full bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        role="progressbar"
        aria-label="Memuat"
      >
        <motion.div
          className="h-full rounded-full bg-blue-600"
          style={{ width: barWidth }}
        />
      </motion.div>
    </motion.div>
  );
}