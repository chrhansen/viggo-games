export const STAR_DEPTH = 900;
export const STAR_BEHIND = 24;
export const BLAST_LIFETIME = 0.7;
export const BLAST_RADIUS = 14;

export function wrapStarDepth(z, distance) {
  const span = STAR_DEPTH + STAR_BEHIND;
  return ((z + distance + STAR_DEPTH) % span + span) % span - STAR_DEPTH;
}

export function advanceStars(positions, distance) {
  for (let index = 2; index < positions.length; index += 3) {
    positions[index] = wrapStarDepth(positions[index], distance);
  }
}

export function raiderBlastDamage(distance, age) {
  if (age < 0 || age >= BLAST_LIFETIME) return 0;
  const radius = 3.8 + (BLAST_RADIUS - 3.8) * age / BLAST_LIFETIME;
  if (distance > radius + 2.5) return 0;
  return Math.max(4, Math.round(14 * (1 - distance / (BLAST_RADIUS + 2.5))));
}
