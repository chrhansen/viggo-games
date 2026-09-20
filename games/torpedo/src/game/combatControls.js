import { PLAYER_BOUNDS, PLAYER_DODGE_SPEED } from './combatConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function updatePlayerControls(combat, delta) {
  const speed = PLAYER_DODGE_SPEED;
  let moveX = 0;
  let moveY = 0;

  if (combat.keys.has('ArrowLeft') || combat.keys.has('KeyA')) moveX -= 1;
  if (combat.keys.has('ArrowRight') || combat.keys.has('KeyD')) moveX += 1;
  if (combat.keys.has('ArrowUp') || combat.keys.has('KeyW')) moveY += 1;
  if (combat.keys.has('ArrowDown') || combat.keys.has('KeyS')) moveY -= 1;

  const inputVector = combat.input.vector();
  moveX = clamp(moveX + inputVector.x, -1, 1);
  moveY = clamp(moveY + inputVector.y, -1, 1);

  if (combat.view === 'periscope') {
    if (combat.keys.has('KeyQ')) combat.periscopeYaw += delta * 1.4;
    if (combat.keys.has('KeyE')) combat.periscopeYaw -= delta * 1.4;
  }

  const length = Math.hypot(moveX, moveY) || 1;
  combat.player.position.x = clamp(
    combat.player.position.x + (moveX / length) * speed * delta,
    -PLAYER_BOUNDS.x,
    PLAYER_BOUNDS.x
  );
  combat.player.position.y = clamp(
    combat.player.position.y + (moveY / length) * speed * delta,
    -PLAYER_BOUNDS.y,
    PLAYER_BOUNDS.y
  );
}
