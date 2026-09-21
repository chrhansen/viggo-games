import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { OceanCombat } from '../../games/torpedo/src/game/OceanCombat.js';
import { BossLoop } from '../../games/torpedo/src/game/bossLoop.js';

function combatFixture() {
  const combat = Object.assign(Object.create(OceanCombat.prototype), {
    world: new THREE.Group(),
    player: { position: new THREE.Vector3(0, 0, 0) },
    enemies: [],
    spawnTimer: 100,
    damagePlayer: vi.fn(),
    fireEnemyTorpedo: vi.fn()
  });
  combat.bossLoop = new BossLoop(combat);
  return combat;
}

function expectForwardHeading(mesh: THREE.Object3D) {
  const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(mesh.quaternion);
  expect(forward.x).toBeCloseTo(0);
  expect(forward.y).toBeCloseTo(0);
  expect(forward.z).toBeCloseTo(1);
}

describe('Torpedo enemy courses', () => {
  it('holds the spawn lane, depth and heading while tracking the player with shots', () => {
    const combat = combatFixture();
    combat.spawnEnemy();
    const enemy = combat.enemies[0];
    enemy.mesh.position.set(-12, 4, -60);
    const start = enemy.mesh.position.clone();
    for (const [x, y] of [[18, -8], [-20, 9]]) {
      combat.player.position.set(x, y, 0);
      enemy.shootTimer = 0;
      combat.updateEnemies(0.1);
      expect(enemy.mesh.position.x).toBe(start.x);
      expect(enemy.mesh.position.y).toBe(start.y);
      expectForwardHeading(enemy.mesh);
      const [, aim] = combat.fireEnemyTorpedo.mock.lastCall;
      const target = combat.player.position.clone().sub(enemy.mesh.position).normalize();
      expect(aim.distanceTo(target)).toBeLessThan(0.00001);
    }
    expect(enemy.mesh.position.z).toBeCloseTo(start.z + enemy.speed * 0.2);
    expect(combat.damagePlayer).not.toHaveBeenCalled();
  });

  it('lets a nearby submarine pass without veering into the player or turning back', () => {
    const combat = combatFixture();
    combat.spawnEnemy();
    const enemy = combat.enemies[0];
    enemy.mesh.position.set(5, 0, -5);
    enemy.speed = 6;
    enemy.shootTimer = 100;
    for (let frame = 0; frame < 30; frame++) combat.updateEnemies(0.1);
    expect(enemy.mesh.position.x).toBe(5);
    expect(enemy.mesh.position.z).toBeCloseTo(13);
    expectForwardHeading(enemy.mesh);
    expect(combat.damagePlayer).not.toHaveBeenCalled();
  });

  it('keeps bosses on a straight course, including collisions and subsequent passes', () => {
    const combat = combatFixture();
    const loop = combat.bossLoop;
    loop.spawnBoss();
    const boss = loop.boss;
    boss.mesh.position.set(-10, 3, -60);
    combat.player.position.set(20, -8, 0);
    boss.shootTimer = 0;
    loop.updateBoss(0.1);
    expect(boss.mesh.position.x).toBe(-10);
    expect(boss.mesh.position.y).toBe(3);
    expect(boss.mesh.position.z).toBeCloseTo(-60 + boss.speed * 0.1);
    expectForwardHeading(boss.mesh);
    const [, aim] = combat.fireEnemyTorpedo.mock.calls[1];
    const target = combat.player.position.clone().sub(boss.mesh.position).normalize();
    expect(aim.distanceTo(target)).toBeLessThan(0.00001);

    combat.player.position.copy(boss.mesh.position);
    const beforeCollision = boss.mesh.position.clone();
    loop.updateBoss(0.1);
    expect(boss.mesh.position.x).toBe(beforeCollision.x);
    expect(boss.mesh.position.y).toBe(beforeCollision.y);
    expect(boss.mesh.position.z).toBeCloseTo(beforeCollision.z + boss.speed * 0.1);

    combat.player.position.set(22, -6, boss.mesh.position.z - 40);
    loop.updateBoss(0.1);
    expect(boss.mesh.position.x).toBe(-10);
    expect(boss.mesh.position.y).toBe(3);
    expect(boss.mesh.position.z).toBe(combat.player.position.z - 104);
    expectForwardHeading(boss.mesh);
  });
});
