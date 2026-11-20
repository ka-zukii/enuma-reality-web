export type CameraMode = "follow" | "iso" | "first";

export const CAMERA_OPTIONS: { value: CameraMode; label: string }[] = [
  { value: "follow", label: "Ikuti karakter" },
  { value: "iso", label: "Isometrik" },
  { value: "first", label: "Orang pertama" },
];

/** Urutan putaran untuk tombol C */
export const CAMERA_CYCLE: CameraMode[] = ["follow", "iso", "first"];