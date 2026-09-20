export const chickenDesignIds = ["classic", "spots", "flame", "robot"] as const;
export const chickenColorIds = [
  "butter",
  "red",
  "blue",
  "green",
  "grape",
  "charcoal",
] as const;

export type ChickenDesign = (typeof chickenDesignIds)[number];
export type ChickenColor = (typeof chickenColorIds)[number];

export interface ChickenProfile {
  color: ChickenColor;
  design: ChickenDesign;
  name: string;
}

export const defaultChickenProfile: ChickenProfile = {
  color: "butter",
  design: "classic",
  name: "Nugget",
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

export function normalizeChickenName(value: unknown) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 14);
  return normalized || defaultChickenProfile.name;
}

export function randomChickenName(currentName: string, random = Math.random) {
  const normalizedCurrent = normalizeChickenName(currentName);
  const choices = chickenNames.filter((name) => name !== normalizedCurrent);
  const randomIndex = Math.floor(Math.max(0, random()) * choices.length);
  return choices[Math.min(choices.length - 1, randomIndex)] ?? defaultChickenProfile.name;
}
