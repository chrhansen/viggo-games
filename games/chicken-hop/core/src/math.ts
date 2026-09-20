export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

export const intersects = (
  a: { height: number; width: number; x: number; y: number },
  b: { height: number; width: number; x: number; y: number },
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
