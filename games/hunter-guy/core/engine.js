import { createWildlife } from "./wildlife.js";
import { createCollisionWorld, movingBodyCircles } from "./collisions.js";
import { WORLD_HALF, PLAYER_HEIGHT, LOOK_RANGE, seededRandom, terrainHeight, movementDelta } from "./world.js";
export { terrainHeight, LOOK_RANGE, TOUCH_LOOK_SENSITIVITY, touchMoveVector } from "./world.js";
export const weaponStats = {
  rifle: { name: "Rifle", cooldown: 0.24, range: 90 },
  bow: { name: "Bow", cooldown: 0.8, range: 70 },
  knife: { name: "Knife", cooldown: 0.38, range: 5 },
  squirt: { name: "Squirt Gun", cooldown: 0.18, range: 26 },
};

export function createHunterGame({ seed = 112, colliders = [] } = {}) {
  const wildlife = createWildlife(seed);
  const random = seededRandom(seed + 1);
  const rand = (min, max) => min + random() * (max - min);
  const hunters = Array.from({ length: 5 }, () => ({
    center: { x: rand(-145, 145), z: rand(-145, 145) },
    patrolRadius: rand(18, 52), angle: rand(0, Math.PI * 2), speed: rand(0.22, 0.46),
    group: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
  }));
  const state = {
    active: false, time: 0, score: 0, selectedWeapon: "rifle", cooldown: 0,
    message: "Rifle ready", messageTimer: 0,
    player: { x: 0, y: terrainHeight(0, 0) + PLAYER_HEIGHT, z: 0, yaw: 0, pitch: 0 },
    animals: wildlife.animals, hunters,
  };
  const collisions = createCollisionWorld(colliders, () => movingBodyCircles(state.animals, hunters), WORLD_HALF);
  function setMessage(text, seconds = 1.2) { state.message = text; state.messageTimer = seconds; }
  function setActive(active) { state.active = active; }
  function setWeapon(weapon) {
    if (!Object.hasOwn(weaponStats, weapon)) return;
    state.selectedWeapon = weapon;
    setMessage(`${weaponStats[weapon].name} ready`, 1.1);
  }
  function look(yaw, pitch) {
    if (!state.active) return;
    state.player.yaw = yaw;
    state.player.pitch = Math.max(-LOOK_RANGE, Math.min(LOOK_RANGE, pitch));
  }
  function patrol(delta) {
    for (const hunter of hunters) {
      hunter.angle += hunter.speed * 0.4 * delta;
      const x = hunter.center.x + Math.cos(hunter.angle) * hunter.patrolRadius;
      const z = hunter.center.z + Math.sin(hunter.angle) * hunter.patrolRadius;
      Object.assign(hunter.group.position, { x, y: terrainHeight(x, z), z });
      hunter.group.rotation.y = -hunter.angle + Math.PI * 0.5;
    }
  }
  patrol(0);
  function step(elapsed, input = {}) {
    if (!state.active || !Number.isFinite(elapsed) || elapsed <= 0) return;
    const delta = Math.min(elapsed, 0.1);
    state.time += delta;
    state.cooldown = Math.max(0, state.cooldown - delta);
    state.messageTimer -= delta;
    if (state.messageTimer <= 0) state.message = `${weaponStats[state.selectedWeapon].name} ready`;
    wildlife.update(delta);
    patrol(delta);
    state.player.yaw += (input.turn || 0) * 0.95 * delta;
    const movement = movementDelta(input.forward || 0, input.strafe || 0, state.player.yaw, delta);
    collisions.move(state.player, movement.x, movement.z);
    state.player.y = terrainHeight(state.player.x, state.player.z) + PLAYER_HEIGHT;
  }
  // Renderers supply geometric hits; all range, damage, cooldown and scoring rules stay here.
  function fire(hit) {
    if (!state.active || state.cooldown > 0) return false;
    const weapon = state.selectedWeapon;
    const stats = weaponStats[weapon];
    state.cooldown = stats.cooldown;
    const animal = hit && Number.isFinite(hit.distance) && hit.distance >= 0 && hit.distance <= stats.range
      ? state.animals[hit.animalIndex] : undefined;
    if (weapon === "squirt") {
      setMessage(animal && wildlife.squirt(animal) ? `Splash! ${animal.name} runs away.` : "Splash in the leaves.", 0.9);
    } else if (animal?.alive) {
      const result = wildlife.applyDamage(animal, 1);
      if (result.killed) {
        state.score++;
        const prefix = weapon === "knife" ? "Knife close hit." : `${stats.name} hit.`;
        setMessage(`${prefix} ${animal.name} tagged.`, 1.3);
      } else setMessage(`${animal.name} hit! ${result.hp} shot left.`, 1.1);
    } else {
      setMessage({ rifle: "Rifle shot missed.", bow: "Arrow missed.", knife: "Too far for knife." }[weapon], 0.8);
    }
    return true;
  }
  return { state, setActive, setWeapon, setMessage, look, step, fire };
}
