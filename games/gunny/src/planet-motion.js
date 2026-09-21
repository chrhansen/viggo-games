export const EARTH_DAY_SECONDS = 1800;
export const MOON_ORBIT_SECONDS = 240;
export const MOON_ORBIT_RADIUS = 132;
export const MOON_ORBIT_INCLINATION = Math.PI * 0.34;
const TAU = Math.PI * 2;

export function moonOrbitPosition(time) {
  const angle = 0.72 + time * TAU / MOON_ORBIT_SECONDS;
  return {
    x: Math.cos(angle) * MOON_ORBIT_RADIUS,
    y: Math.sin(angle) * MOON_ORBIT_RADIUS * Math.sin(MOON_ORBIT_INCLINATION),
    z: Math.sin(angle) * MOON_ORBIT_RADIUS * Math.cos(MOON_ORBIT_INCLINATION),
  };
}

export function updatePlanets(earth, moon, time, playerZ, aspect = 16 / 9) {
  // Keep the same system visible in portrait; its distances are compressed for play.
  const framing = Math.min(1, aspect / 1.15);
  earth.position.set(-150 * framing, -52, playerZ - 430 / framing);
  if (earth.userData.body) {
    earth.userData.body.rotation.y = 2.5 + time * TAU / EARTH_DAY_SECONDS;
  }
  const orbit = moonOrbitPosition(time);
  moon.position.copy(earth.position).add(orbit);
  moon.lookAt(earth.position);
}
