export const vector = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function advance(position, velocity, delta) {
  for (const axis of ['x', 'y', 'z']) position[axis] += velocity[axis] * delta;
}

export function muzzlePosition(craft, offset) {
  const { x, y } = craft.rotation;
  // Local forward muzzle transformed by the craft's XYZ Euler rotation.
  const length = offset * craft.scale;
  return vector(
    craft.position.x + Math.sin(y) * length,
    craft.position.y - Math.sin(x) * Math.cos(y) * length,
    craft.position.z + Math.cos(x) * Math.cos(y) * length,
  );
}
