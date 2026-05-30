import * as THREE from 'three';

const FORMATION_OFFSETS = [
  [-14, 8],
  [-25, 18],
  [-36, 30],
  [14, 8],
  [25, 18],
  [36, 30]
];

const randomBetween = (min, max) => min + Math.random() * (max - min);

export function createHelperFormation() {
  return FORMATION_OFFSETS.map(([x, z], index) => ({
    offset: new THREE.Vector3(x, randomBetween(-1.6, 1.8), z),
    shootTimer: 0.75 + index * 0.55
  }));
}

export function resetHelperFormation(helpers) {
  helpers.forEach((helper, index) => {
    helper.shootTimer = 0.75 + index * 0.55;
  });
}

export function updateHelperFormation(helpers, player, enemies, delta, fire) {
  if (!enemies.length) return;

  for (const helper of helpers) {
    helper.shootTimer -= delta;
    if (helper.shootTimer > 0) continue;

    const position = player.position.clone().add(helper.offset);
    fire(position, new THREE.Vector3(0, 0, -1));
    helper.shootTimer = randomBetween(4.4, 7.2);
  }
}
