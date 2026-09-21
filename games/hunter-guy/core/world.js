export const WORLD_HALF = 180;
export const PLAYER_HEIGHT = 1.8;
export const LOOK_RANGE = Math.PI / 12;
export const TOUCH_LOOK_SENSITIVITY = 0.0042;
export function seededRandom(seed = 73) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function terrainHeight(x, z) {
  return Math.sin(x * 0.014) * 2.1 + Math.cos(z * 0.011) * 1.5 + Math.sin((x + z) * 0.009) * 1.3;
}
export function movementDelta(forward, strafe, yaw, delta) {
  const length = Math.max(1, Math.hypot(forward, strafe));
  const distance = 10 * delta / length;
  return {
    x: (-Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * distance,
    z: (-Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * distance,
  };
}
export function touchMoveVector(x, y) {
  const sx = Math.abs(x) > 0.3 ? Math.sign(x) : 0;
  const sy = Math.abs(y) > 0.3 ? Math.sign(y) : 0;
  const length = Math.max(1, Math.hypot(sx, sy));
  return { x: sx / length, y: sy / length };
}
