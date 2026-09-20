import { PLAYER_MAX_HULL } from './combatConfig.js';

export function performInteriorAction(combat, action) {
  if (action === 'steer') return 'Holding course';

  if (action === 'repair') {
    if (!combat.player.engineBroken) return 'Engine running';
    combat.player.engineBroken = false;
    combat.player.forwardSpeed = 9;
    combat.player.hull = Math.min(PLAYER_MAX_HULL, combat.player.hull + 8);
    combat.updateHud();
    return 'Engine repaired';
  }

  if (action === 'rest') {
    combat.player.hull = Math.min(PLAYER_MAX_HULL, combat.player.hull + 4);
    combat.updateHud();
    return 'Rest complete';
  }

  if (action === 'eat') return 'Meal finished';

  if (action === 'sonar') {
    combat.spawnTimer = Math.max(combat.spawnTimer, 2.2);
    return `${combat.enemies.length} contacts`;
  }

  return 'Ready';
}
