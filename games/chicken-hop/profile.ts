export type ChickenDesign = "classic" | "flame" | "robot" | "spots";
export type ChickenColor = "blue" | "butter" | "charcoal" | "grape" | "green" | "red";

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

export const normalizeChickenName = (value: unknown) => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 14);
  return normalized || "Nugget";
};
