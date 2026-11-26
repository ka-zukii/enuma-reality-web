import type { Vec3 } from "@/config/buildings";

export interface DoorGroup {
  /** Nama mesh di file .glb */
  meshes: string[];
  /** Arah dan jarak geser saat terbuka (meter, koordinat lokal model) */
  slide: Vec3;
}

export interface DoorConfig {
  groups: DoorGroup[];
  /** Jarak pemain ke pintu (dari entrance) agar pintu terbuka */
  openRadius: number;
}

/** Hanya gedung kota. Lunara Cafe dan Kantor Enuma belum punya pintu geser. */
export const CITY_DOORS: Partial<Record<string, DoorConfig>> = {
  "warung-madura": {
    groups: [
      {
        meshes: ["Door_Slab_Right", "Door_Slab_Right_Knob"],
        slide: [-0.8, 0, 0],
      },
      {
        meshes: ["Door_Slab_Left", "Door_Slab_Left_Knob"],
        slide: [0.8, 0, 0],
      },
    ],
    openRadius: 2.5,
  },
  indomart: {
    groups: [
      {
        meshes: ["Door_Slab_Right", "Door_Slab_Right_Knob"],
        slide: [0, 0, -0.9],
      },
      {
        meshes: ["Door_Slab_Left", "Door_Slab_Left_Knob"],
        slide: [0, 0, 0.9],
      },
    ],
    openRadius: 2.5,
  },
  "lunara-cafe": {
    // Dua daun geser sejajar di sumbu Z, masing-masing lebar ~0,92 m.
    // Geser penuh supaya ruang masuk benar-benar terbuka.
    groups: [
      {
        meshes: ["Door_Slab_Right", "Door_Slab_Right_Knob"],
        slide: [0, 0, -0.8],
      },
      {
        meshes: ["Door_Slab_Left", "Door_Slab_Left_Knob"],
        slide: [0, 0, 0.8],
      },
    ],
    openRadius: 2.5,
  },
  "enuma-hq": {
    groups: [],
    openRadius: 2.5,
  },

};