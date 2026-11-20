/** Data statis Enuma untuk tampilan. Ubah di sini, tampilan ikut berubah. */

export const COMPANY = {
  name: "Enuma Technology",
  tagline: "Software · IoT · Robotics",
  city: "Karanganyar",
};

/**
 * Jam kerja (WIB). TODO: pastikan ke Enuma.
 * days: 0 = Minggu, 1 = Senin, ... 6 = Sabtu
 */
export const WORK_HOURS = { days: [1, 2, 3, 4, 5], start: 8, end: 17 };

export interface Room {
  id: string;
  label: string;
  /** Ikut tampil di menu "Sudut Pandang" */
  inViewMenu: boolean;
}

export const ROOMS: Room[] = [
  { id: "ruang-depan", label: "Ruang Depan", inViewMenu: true },
  { id: "ruang-kerja", label: "Ruang Kerja", inViewMenu: true },
  { id: "ruang-1", label: "Ruang 1", inViewMenu: true },
  { id: "ruang-2", label: "Ruang 2", inViewMenu: true },
  { id: "mushola", label: "Mushola", inViewMenu: false },
  { id: "dapur", label: "Dapur", inViewMenu: true },
  { id: "toilet", label: "Toilet", inViewMenu: false },
];

/** Daftar untuk dropdown "Sudut Pandang" */
export const VIEW_PRESETS: string[] = [
  "Beranda",
  ...ROOMS.filter((r) => r.inViewMenu).map((r) => r.label),
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** TODO: pastikan deskripsi ke yang bersangkutan */
  desc: string;
}

/** Urut sesuai hierarki */
export const TEAM: TeamMember[] = [
  {
    id: "andreas",
    name: "Andreas",
    role: "Direktur Utama",
    desc: "Memimpin arah dan pengembangan perusahaan",
  },
  {
    id: "redita",
    name: "Redita",
    role: "Direktur Keuangan",
    desc: "Mengelola keuangan perusahaan",
  },
  {
    id: "gibran",
    name: "Gibran",
    role: "Direktur Relasi Customer",
    desc: "Menjalin komunikasi dengan klien dan calon klien",
  },
  {
    id: "puthut",
    name: "Puthut",
    role: "General Asisten",
    desc: "Mendukung koordinasi operasional dan tim produksi",
  },
];

/** Tombol status di kartu Jam Kerja (urutan sesuai desain: 3 kolom x 2 baris) */
export const STATUS_CHIPS = [
  "Live",
  "Stand-Up",
  "Istirahat",
  "Pagi",
  "Sore",
  "Malam",
] as const;


/**
 * Kontak untuk popup Keluar. Isi dengan data resmi dari Enuma.
 * - email: alamat email (untuk tombol "Tanya lewat email")
 * - instagram: username tanpa @ (untuk tombol Follow)
 * Selama kosong, tombol email mengarah ke website dan tombol Follow nonaktif.
 */
export const CONTACT = {
  website: "https://enumatechnology.com",
  email: "",
  instagram: "",
};