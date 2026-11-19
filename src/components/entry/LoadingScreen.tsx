import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";

// Durasi minimum layar loading tampil, supaya tidak berkedip
// ketika aset sudah termuat sangat cepat.
const MIN_DISPLAY_MS = 1200;

type Props = {
  onDone?: () => void;
};

export default function LoadingScreen({ onDone }: Props) {
  const { progress, total } = useProgress();

  // Progres semu hanya dipakai saat belum ada aset yang terdaftar (total === 0).
  const [fallback, setFallback] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible, setVisible] = useState(true);

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

  const percent = total === 0 ? fallback : Math.min(100, Math.round(progress));
  const ready = minElapsed && (total === 0 || progress >= 100);

  useEffect(() => {
    if (ready) setVisible(false);
  }, [ready]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, #ffffff 0%, #c7d7fb 45%, #2563eb 100%)",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <img
            src="/logo-enuma.png"
            alt="Enuma"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />

          <p className="mt-4 text-base font-semibold tracking-tight text-slate-900">
            Enuma <span className="text-blue-600">Technology</span>
          </p>

          <div className="mt-6 w-full max-w-[220px] px-6">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/60">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 text-right text-xs font-medium tabular-nums text-blue-700">
              {percent}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}