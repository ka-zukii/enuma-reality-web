import { useInteractHint } from "@/lib/interactHint";

const CSS = `
.ik-hint{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:12px;padding:7px 7px 7px 16px;border-radius:999px;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 55%,#1e3a8a 100%);color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:15px;font-weight:700;letter-spacing:.2px;line-height:1;white-space:nowrap;user-select:none;pointer-events:none;border:1px solid rgba(255,255,255,.2);box-shadow:0 12px 30px -8px rgba(37,99,235,.6),0 4px 12px rgba(15,23,42,.3),inset 0 1px 0 rgba(255,255,255,.28);animation:ik-hint-in .25s cubic-bezier(.2,.8,.2,1) both}
.ik-hint-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:#7dd3fc;animation:ik-hint-pulse 1.6s ease-out infinite}
.ik-hint-key{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;padding:0 9px;box-sizing:border-box;border-radius:10px;background:linear-gradient(180deg,#ffffff 0%,#e2e8f0 100%);color:#1e3a8a;font-size:14px;font-weight:800;box-shadow:0 3px 0 #94a3b8,0 8px 14px rgba(0,0,0,.25)}
@keyframes ik-hint-in{from{opacity:0;transform:translate(-50%,12px) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes ik-hint-pulse{0%{box-shadow:0 0 0 0 rgba(125,211,252,.75)}70%{box-shadow:0 0 0 9px rgba(125,211,252,0)}100%{box-shadow:0 0 0 0 rgba(125,211,252,0)}}
@media (prefers-reduced-motion:reduce){.ik-hint,.ik-hint-dot{animation:none}}
`;

/** Tombol interaksi di tengah bawah layar. Tidak bergantung pada kamera atau posisi 3D. */
export function InteractHint() {
  const hint = useInteractHint();
  if (!hint) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="ik-hint" role="status" aria-live="polite">
        <span className="ik-hint-dot" />
        <span>{hint.label}</span>
        {hint.key && <span className="ik-hint-key">E</span>}
      </div>
    </>
  );
}