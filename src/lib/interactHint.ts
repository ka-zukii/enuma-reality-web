import { useSyncExternalStore } from "react";

/** Petunjuk tombol interaksi di layar. `key` = tampilkan keycap "E". */
export interface InteractHintState {
  label: string;
  key: boolean;
}

let current: InteractHintState | null = null;
const listeners = new Set<() => void>();

/**
 * Dipanggil dari OfficeScene setiap frame. Listener hanya dipanggil bila isinya
 * benar-benar berubah, jadi tidak ada re-render per frame.
 */
export function setInteractHint(next: InteractHintState | null) {
  if (current === next) return;
  if (current && next && current.label === next.label && current.key === next.key) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInteractHint(): InteractHintState | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}