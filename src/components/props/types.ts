type BuildingVariant = "office" | "shop" | "cafe";

export type FacadeStyle = BuildingVariant;

export interface BuildingProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  roofColor?: string;
  accentColor?: string;
  name: string;
  signText?: string;
  subtitle?: string;
  tag?: string;
  variant?: BuildingVariant;
  onClick?: () => void;
  badgeAction?: string;
  badgeIcon?: "game" | "cafe" | "office" | "shop";
  badgePosition?: [number, number, number];
}
