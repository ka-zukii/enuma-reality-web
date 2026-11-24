/** Posisi pemain lokal di kota, diperbarui setiap frame oleh OfficeScene */
export const playerPos = { x: 0, z: 0 };

/** Gedung yang pintunya sudah terbuka penuh (dipakai untuk memunculkan popup) */
export const doorReady: Record<string, boolean> = {};