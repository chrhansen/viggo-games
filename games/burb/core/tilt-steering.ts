export type GravityProjection = { x: number | null; y: number | null };

export function getGravityRollAngle(gravity: GravityProjection, screenAngle = 0) {
  if (gravity.x === null || gravity.y === null || !Number.isFinite(gravity.x) || !Number.isFinite(gravity.y)) return null;
  const radians = screenAngle * Math.PI / 180;
  const screenX = gravity.x * Math.cos(radians) - gravity.y * Math.sin(radians);
  const screenY = gravity.x * Math.sin(radians) + gravity.y * Math.cos(radians);
  if (Math.hypot(screenX, screenY) < 5.5) return null;
  return Math.atan2(screenX, -screenY) * 180 / Math.PI;
}

export function signedAngleDelta(angle: number, baseline: number) {
  return ((angle - baseline + 180) % 360 + 360) % 360 - 180;
}

export function mapTiltAngleToSteer(angle: number, deadZone = 4, fullSteer = 36) {
  const magnitude = Math.min(Math.abs(angle), fullSteer);
  if (magnitude <= deadZone) return 0;
  return (magnitude - deadZone) / (fullSteer - deadZone) * Math.sign(angle);
}
