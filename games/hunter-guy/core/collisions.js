const CELL_SIZE = 8;
export const PLAYER_RADIUS = 0.35;

export function createCollisionWorld(staticCircles, getMovingCircles, worldHalf) {
  const cells = new Map();
  for (const circle of staticCircles) {
    const key = `${Math.floor(circle.x / CELL_SIZE)},${Math.floor(circle.z / CELL_SIZE)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(circle);
  }
  const maxStaticRadius = Math.max(0, ...staticCircles.map((circle) => circle.radius));
  const clamp = (value) => Math.max(-worldHalf + PLAYER_RADIUS, Math.min(worldHalf - PLAYER_RADIUS, value));

  function nearby(x, z, moving) {
    const range = PLAYER_RADIUS + maxStaticRadius;
    const result = [...moving];
    for (let cx = Math.floor((x - range) / CELL_SIZE); cx <= Math.floor((x + range) / CELL_SIZE); cx++) {
      for (let cz = Math.floor((z - range) / CELL_SIZE); cz <= Math.floor((z + range) / CELL_SIZE); cz++) {
        const entries = cells.get(`${cx},${cz}`);
        if (entries) result.push(...entries);
      }
    }
    return result;
  }

  function move(position, dx, dz) {
    const moving = getMovingCircles();
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER_RADIUS * 0.5)));
    for (let step = 0; step < steps; step++) {
      const previousX = position.x;
      const previousZ = position.z;
      position.x = clamp(position.x + dx / steps);
      position.z = clamp(position.z + dz / steps);
      // Small movement steps prevent crossing a trunk during a slow frame.
      for (let pass = 0; pass < 8; pass++) {
        let overlap = false;
        for (const circle of nearby(position.x, position.z, moving)) {
          const radius = PLAYER_RADIUS + circle.radius;
          let nx = position.x - circle.x;
          let nz = position.z - circle.z;
          let distance = Math.hypot(nx, nz);
          if (distance >= radius) continue;
          if (distance < 1e-8) {
            nx = previousX - circle.x;
            nz = previousZ - circle.z;
            distance = Math.hypot(nx, nz);
            if (distance < 1e-8) { nx = 1; nz = 0; distance = 1; }
          }
          position.x = clamp(circle.x + nx / distance * (radius + 0.0001));
          position.z = clamp(circle.z + nz / distance * (radius + 0.0001));
          overlap = true;
        }
        if (!overlap) break;
      }
      const blocked = nearby(position.x, position.z, moving).some((circle) =>
        Math.hypot(position.x - circle.x, position.z - circle.z) < PLAYER_RADIUS + circle.radius - 0.00001
      );
      if (blocked) {
        position.x = previousX;
        position.z = previousZ;
      }
    }
  }
  return { move };
}

export function movingBodyCircles(animals, hunters) {
  const circles = [];
  const profiles = { fox: [0.3, 0.48], deer: [0.39, 0.7], bear: [0.59, 0.85] };
  for (const animal of animals) {
    if (!animal.alive || !animal.group.visible) continue;
    const [radius, length] = profiles[animal.type];
    const { position, rotation } = animal.group;
    for (const offset of [-length, 0, length]) {
      circles.push({
        x: position.x + Math.cos(rotation.y) * offset,
        z: position.z - Math.sin(rotation.y) * offset,
        radius,
      });
    }
  }
  for (const hunter of hunters) {
    circles.push({ x: hunter.group.position.x, z: hunter.group.position.z, radius: 0.43 });
  }
  return circles;
}
