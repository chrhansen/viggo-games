export type Point2 = { x: number; z: number };
export type Obstacle =
  | { kind: 'circle'; center: Point2; radius: number }
  | { kind: 'polygon'; points: Point2[] };
export const RIDER_RADIUS = 0.85;
const CELL_SIZE = 16;
const SKIN = 0.0001;

function bounds(obstacle: Obstacle) {
  if (obstacle.kind === 'circle') {
    const { center, radius } = obstacle;
    return { minX: center.x - radius, maxX: center.x + radius, minZ: center.z - radius, maxZ: center.z + radius };
  }
  return {
    minX: Math.min(...obstacle.points.map((p) => p.x)), maxX: Math.max(...obstacle.points.map((p) => p.x)),
    minZ: Math.min(...obstacle.points.map((p) => p.z)), maxZ: Math.max(...obstacle.points.map((p) => p.z)),
  };
}

export function obstaclePush(position: Point2, obstacle: Obstacle, radius = RIDER_RADIUS): Point2 | null {
  if (obstacle.kind === 'circle') {
    const dx = position.x - obstacle.center.x, dz = position.z - obstacle.center.z;
    const distance = Math.hypot(dx, dz);
    const overlap = radius + obstacle.radius - distance;
    if (overlap <= 0) return null;
    if (distance < 1e-8) return { x: overlap + SKIN, z: 0 };
    return { x: dx / distance * (overlap + SKIN), z: dz / distance * (overlap + SKIN) };
  }
  let inside = false;
  let nearestDistance = Infinity;
  let nearest = { x: 0, z: 0 };
  const points = obstacle.points;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    if ((a.z > position.z) !== (b.z > position.z) &&
      position.x < (b.x - a.x) * (position.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
    const dx = b.x - a.x, dz = b.z - a.z;
    const lengthSq = dx * dx + dz * dz;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((position.x - a.x) * dx + (position.z - a.z) * dz) / lengthSq));
    const point = { x: a.x + dx * t, z: a.z + dz * t };
    const distance = Math.hypot(position.x - point.x, position.z - point.z);
    if (distance < nearestDistance) { nearestDistance = distance; nearest = point; }
  }
  if (!inside && nearestDistance >= radius) return null;
  if (nearestDistance < 1e-8) {
    const center = points.reduce((sum, p) => ({ x: sum.x + p.x / points.length, z: sum.z + p.z / points.length }), { x: 0, z: 0 });
    const dx = position.x - center.x, dz = position.z - center.z;
    const length = Math.hypot(dx, dz) || 1;
    return { x: dx / length * (radius + SKIN), z: dz / length * (radius + SKIN) };
  }
  const distance = inside ? radius + nearestDistance + SKIN : radius - nearestDistance + SKIN;
  const sign = inside ? -1 : 1;
  return { x: (position.x - nearest.x) / nearestDistance * distance * sign, z: (position.z - nearest.z) / nearestDistance * distance * sign };
}

export function createRideCollisions(obstacles: Obstacle[]) {
  const grid = new Map<string, Obstacle[]>();
  for (const obstacle of obstacles) {
    const box = bounds(obstacle);
    for (let x = Math.floor(box.minX / CELL_SIZE); x <= Math.floor(box.maxX / CELL_SIZE); x++) {
      for (let z = Math.floor(box.minZ / CELL_SIZE); z <= Math.floor(box.maxZ / CELL_SIZE); z++) {
        const key = `${x},${z}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(obstacle);
      }
    }
  }
  function nearby(position: Point2) {
    const result = new Set<Obstacle>();
    for (let x = Math.floor((position.x - RIDER_RADIUS) / CELL_SIZE); x <= Math.floor((position.x + RIDER_RADIUS) / CELL_SIZE); x++) {
      for (let z = Math.floor((position.z - RIDER_RADIUS) / CELL_SIZE); z <= Math.floor((position.z + RIDER_RADIUS) / CELL_SIZE); z++) {
        for (const obstacle of grid.get(`${x},${z}`) ?? []) result.add(obstacle);
      }
    }
    return result;
  }
  return {
    move(position: Point2, dx: number, dz: number) {
      const start = { ...position };
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.25));
      let collided = false;
      for (let step = 0; step < steps; step++) {
        const previous = { x: position.x, z: position.z };
        position.x += dx / steps;
        position.z += dz / steps;
        for (let pass = 0; pass < 12; pass++) {
          let resolved = true;
          for (const obstacle of nearby(position)) {
            const push = obstaclePush(position, obstacle);
            if (!push) continue;
            position.x += push.x;
            position.z += push.z;
            collided = true;
            resolved = false;
          }
          if (resolved) break;
        }
        if ([...nearby(position)].some((obstacle) => obstaclePush(position, obstacle))) {
          position.x = previous.x;
          position.z = previous.z;
          collided = true;
          break;
        }
      }
      return { collided, distance: Math.hypot(position.x - start.x, position.z - start.z) };
    },
  };
}
