import { useEffect } from "react";

/** Suara ambient kota ringan (angin lembut & suasana luar ruangan) */
export function CityAmbientSound() {
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let src: AudioBufferSourceNode | null = null;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      try {
        ctx = new AudioContext();
        const len = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
          last = (last + 0.015 * (Math.random() * 2 - 1)) / 1.015;
          data[i] = last * 3.0;
        }
        src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 380;
        const gain = ctx.createGain();
        gain.gain.value = 0.02;
        src.connect(lp).connect(gain).connect(ctx.destination);
        src.start();
      } catch {
        /* Abaikan jika browser memblokir AudioContext */
      }
    };

    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      try {
        src?.stop();
      } catch {
        /* sudah berhenti */
      }
      void ctx?.close();
    };
  }, []);

  return null;
}
