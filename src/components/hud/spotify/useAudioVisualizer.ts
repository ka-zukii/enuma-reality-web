import { useEffect, useState } from "react";
import { analyserNode, store } from "@/components/hud/spotify/player";

export const BAR_COUNT = 12;

export function useAudioVisualizer(active: boolean) {
  const [bass, setBass] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.12));

  // Loop animasi beat & equalizer mengikuti frekuensi audio saat lagu diputar
  useEffect(() => {
    if (!store.playing || !active) {
      setBass(0);
      setBars(Array(BAR_COUNT).fill(0.12));
      return;
    }

    let rafId = 0;
    const freqData = analyserNode
      ? new Uint8Array(analyserNode.frequencyBinCount)
      : null;

    const frame = () => {
      if (analyserNode && freqData) {
        analyserNode.getByteFrequencyData(freqData);
        // Energi bass dari bin frekuensi rendah (0..3)
        let bassSum = 0;
        for (let i = 0; i < 4; i++) bassSum += freqData[i] ?? 0;
        const bassNorm = Math.min(1, bassSum / (4 * 255));
        setBass(bassNorm);

        const nextBars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          const val = (freqData[i] ?? 0) / 255;
          nextBars.push(Math.max(0.12, val));
        }
        setBars(nextBars);
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [store.playing, active]);

  return { bass, bars };
}
