/** Nama zona (dari OfficeScene) menjadi teks untuk lencana "Jelajahi Enuma" */
const ZONE_LABELS: Record<string, string> = {
  "enuma-reality-hq": "Di depan Kantor",
  "board-game-cafe": "Di depan Board Game Cafe",
  "m-cafe": "Di depan M Cafe",
  "taman-kota": "Di Taman Kota",
  "jalan-utama": "Di Jalan Utama",
  "jalan-selatan": "Di Jalan Selatan",
  "jalan-utara": "Di Jalan Utara",
  "jalan-barat": "Di Jalan Barat",
  "jalan-timur": "Di Jalan Timur",
  interior: "Di dalam Gedung",
  "open-space": "Di Kota",
};

export function zoneLabel(zone?: string) {
  return (zone && ZONE_LABELS[zone]) || "Di Kota";
}