import type { ChickenColor, ChickenDesign } from "@viggo-games/chicken-hop-core";

export {
  defaultChickenProfile,
  normalizeChickenName,
  randomChickenName,
  type ChickenColor,
  type ChickenDesign,
  type ChickenProfile,
} from "@viggo-games/chicken-hop-core";

export const chickenDesigns = [
  { id: "classic", label: "Classic" },
  { id: "spots", label: "Spots" },
  { id: "flame", label: "Flame" },
  { id: "robot", label: "Robot" },
] as const satisfies readonly { id: ChickenDesign; label: string }[];

export const chickenColors = [
  {
    id: "butter",
    label: "Butter",
    swatch: "#FFF7EA",
    body: "#FFF7EA",
    wing: "#FDE6C5",
    ink: "rgba(0,0,0,0.18)",
  },
  {
    id: "red",
    label: "Red",
    swatch: "#FF3B30",
    body: "#FF6A5B",
    wing: "#FFD2CD",
    ink: "rgba(0,0,0,0.20)",
  },
  {
    id: "blue",
    label: "Blue",
    swatch: "#4CC9F0",
    body: "#4CC9F0",
    wing: "#D7F4FF",
    ink: "rgba(0,0,0,0.20)",
  },
  {
    id: "green",
    label: "Green",
    swatch: "#2EE59D",
    body: "#2EE59D",
    wing: "#D9FFF0",
    ink: "rgba(0,0,0,0.20)",
  },
  {
    id: "grape",
    label: "Grape",
    swatch: "#9B5DE5",
    body: "#9B5DE5",
    wing: "#EADBFF",
    ink: "rgba(0,0,0,0.22)",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    swatch: "#34324A",
    body: "#34324A",
    wing: "#A9A7B8",
    ink: "rgba(0,0,0,0.22)",
  },
] as const satisfies readonly {
  body: string;
  id: ChickenColor;
  ink: string;
  label: string;
  swatch: string;
  wing: string;
}[];

export function getChickenPalette(color: ChickenColor) {
  return chickenColors.find((option) => option.id === color) ?? chickenColors[0];
}
