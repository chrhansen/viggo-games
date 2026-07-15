export const chickenDesigns = [
  { id: "classic", label: "Classic" },
  { id: "spots", label: "Spots" },
  { id: "flame", label: "Flame" },
  { id: "robot", label: "Robot" },
] as const;

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
] as const;

export type ChickenDesign = (typeof chickenDesigns)[number]["id"];
export type ChickenColor = (typeof chickenColors)[number]["id"];

export interface ChickenProfile {
  name: string;
  design: ChickenDesign;
  color: ChickenColor;
}

export const defaultChickenProfile: ChickenProfile = {
  name: "Nugget",
  design: "classic",
  color: "butter",
};

export const chickenNames = [
  "Nugget",
  "Peep",
  "Waffles",
  "Biscuit",
  "Sunny",
  "Pip",
  "Popcorn",
  "Beans",
  "Doodle",
  "Sprinkles",
  "Captain Cluck",
  "Turbo Beak",
] as const;

export function normalizeChickenName(value: string) {
  const name = value.replace(/\s+/g, " ").trim().slice(0, 14);
  return name || defaultChickenProfile.name;
}

export function randomChickenName(currentName: string, random = Math.random) {
  const normalizedCurrent = normalizeChickenName(currentName);
  const choices = chickenNames.filter((name) => name !== normalizedCurrent);
  const index = Math.min(choices.length - 1, Math.floor(Math.max(0, random()) * choices.length));
  return choices[index] ?? defaultChickenProfile.name;
}

export function getChickenPalette(color: ChickenColor) {
  return chickenColors.find((option) => option.id === color) ?? chickenColors[0];
}
