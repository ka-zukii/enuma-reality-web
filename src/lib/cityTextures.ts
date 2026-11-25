import * as THREE from "three";

function pseudoRnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function makeGrassTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = "#7dd87d";
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) {
      const x = pseudoRnd(i + 1) * S;
      const y = pseudoRnd(i + 901) * S;
      g.fillStyle = i % 2 === 0 ? "rgba(22,163,74,0.16)" : "rgba(187,247,208,0.18)";
      g.fillRect(x, y, 3, 5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makePavingTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = "#e2e8f0";
    g.fillRect(0, 0, S, S);
    const tile = 32;
    for (let row = 0; row < S / tile; row++) {
      for (let col = 0; col < S / tile; col++) {
        const offset = (row % 2) * (tile / 2);
        const shade = pseudoRnd(row * 31 + col * 17) > 0.5 ? "#dbe4ee" : "#e8eef5";
        g.fillStyle = shade;
        g.fillRect((col * tile + offset) % S, row * tile, tile - 2, tile - 2);
      }
    }
    g.strokeStyle = "rgba(100,116,139,0.22)";
    g.lineWidth = 1.5;
    for (let y = 0; y <= S; y += tile) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(S, y);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeAsphaltTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = "#334155";
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 1400; i++) {
      const x = pseudoRnd(i * 3 + 7) * S;
      const y = pseudoRnd(i * 5 + 13) * S;
      g.fillStyle =
        i % 3 === 0 ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.16)";
      g.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.18, 0.18);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
