import { afterEach, describe, expect, it, vi } from 'vitest';
import { TorpedoGame } from '../../games/torpedo/src/game/TorpedoGame.js';
import { OceanCombat } from '../../games/torpedo/src/game/OceanCombat.js';
import { ROOMS } from '../../games/torpedo/src/game/rooms.js';
import { createTorpedoTouchInput } from '../../mobile/src/game/torpedo/touch-input';

const games: TorpedoGame[] = [];
function patrol() { const game = new TorpedoGame(); games.push(game); return game; }
afterEach(() => { for (const game of games) game.dispose(); games.length = 0; vi.restoreAllMocks(); });

describe('shared Torpedo game', () => {
  it('runs without browser rendering or independent animation timers', () => {
    const dom = vi.spyOn(document, 'createElement');
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const game = patrol();
    game.start(); game.step(0.02); game.firePlayerTorpedo(); game.damagePlayer(12);
    game.createBurst(game.player.position, '#ffffff'); game.step(0.02);
    expect(game.player.position.z).toBeCloseTo(-0.36);
    expect(game.getSnapshot()).toMatchObject({ started: true, active: true, hull: 148, ready: false });
    expect(dom).not.toHaveBeenCalled(); expect(raf).not.toHaveBeenCalled();
    expect(Object.getPrototypeOf(OceanCombat.prototype)).toBe(TorpedoGame.prototype);
  });

  it('uses the same normalized steering and bounds for keyboard and native multitouch', () => {
    const web = patrol(), native = patrol(), touch = createTorpedoTouchInput();
    web.start(); native.start(); web.keys.add('ArrowRight'); web.keys.add('ArrowUp');
    touch.hold('right', ['right']); touch.hold('up', ['up']); touch.hold('fire', ['fire']);
    for (let i = 0; i < 100; i++) { web.step(0.02); touch.apply(native); native.step(0.02); }
    expect(native.player.position.x).toBeCloseTo(web.player.position.x);
    expect(native.player.position.y).toBeCloseTo(web.player.position.y);
    expect(native.player.position.y).toBe(14);
    expect(native.playerTorpedoes.length).toBeGreaterThan(1);
    touch.release(['fire']); touch.release(['up']);
    expect(touch.held('right')).toBe(true); expect(touch.held('fire')).toBe(false);
    touch.reset(); touch.apply(native);
    expect(native.input.vector()).toEqual({ x: 0, y: 0 });
  });

  it('respects reload timing, pause, game over, and a complete restart', () => {
    const game = patrol();
    game.firePlayerTorpedo(); expect(game.playerTorpedoes).toHaveLength(0);
    game.start(); game.firePlayerTorpedo(); game.firePlayerTorpedo();
    expect(game.playerTorpedoes).toHaveLength(1);
    game.pause(); const z = game.player.position.z;
    game.step(1); game.firePlayerTorpedo(); expect(game.player.position.z).toBe(z);
    expect(game.playerTorpedoes).toHaveLength(1);
    game.resume(); for (let i = 0; i < 12; i++) game.step(0.04);
    game.firePlayerTorpedo(); expect(game.playerTorpedoes).toHaveLength(2);
    game.damagePlayer(160); expect(game.getSnapshot().gameOver).toBe(true);
    game.step(0.04); game.firePlayerTorpedo(); expect(game.playerTorpedoes).toHaveLength(2);
    game.setView('periscope'); game.periscopeYaw = 1;
    game.restart(); game.start();
    expect(game.getSnapshot()).toMatchObject({ hull: 160, score: 0, ready: true, view: 'front', status: 'Boss 0/5', gameOver: false, active: true });
    expect(game.playerTorpedoes).toHaveLength(0); expect(game.periscopeYaw).toBe(0);
  });

  it('shares regular hits, boss salvos, prizes, and level progression', () => {
    const game = patrol(); game.start(); game.spawnEnemy(); game.firePlayerTorpedo();
    game.playerTorpedoes[0].mesh.position.copy(game.enemies[0].mesh.position);
    game.checkCollisions(); expect(game.player.score).toBe(100); expect(game.bossLoop.regularKills).toBe(1);
    for (let i = 0; i < 5; i++) {
      game.bossLoop.regularKills = game.bossLoop.regularKillsNeeded(); game.bossLoop.update(0);
      const boss = game.bossLoop.boss!;
      game.bossLoop.fireBossSalvo(game.currentDirection());
      expect(game.enemyTorpedoes.length).toBe((i + 1) * 3);
      const position = boss.mesh.position.clone();
      for (let hit = 0; hit < boss.maxHealth; hit++) game.bossLoop.hitBoss({ mesh: { position } });
      expect(game.bossLoop.waitingForPickup).toBe(true);
      game.player.position.copy(position); game.bossLoop.updatePickupSubs(0.02);
      expect(game.bossLoop.waitingForPickup).toBe(false);
    }
    expect(game.getSnapshot()).toMatchObject({ score: 4350, status: 'Level 2' });
  });

  it('shares all five room actions and keeps combat frozen during a visit', () => {
    const game = patrol(); game.start(); game.pause();
    game.player.hull = 80; game.player.engineBroken = true; game.player.forwardSpeed = 4;
    const z = game.player.position.z;
    expect(ROOMS.map(room => game.performInteriorAction(room.action))).toEqual(['Holding course', '0 contacts', 'Rest complete', 'Meal finished', 'Engine repaired']);
    expect(game.player).toMatchObject({ hull: 92, forwardSpeed: 9, engineBroken: false });
    game.step(0.04); expect(game.player.position.z).toBe(z);
    for (let i = 0; i < 50; i++) game.performInteriorAction('rest');
    expect(game.player.hull).toBe(160);
    expect(game.performInteriorAction('repair')).toBe('Engine running');
  });

  it('supports periscope turning and firing, with resize independent of patrol state', () => {
    const game = patrol(), touch = createTorpedoTouchInput(); game.start();
    game.setView('periscope'); touch.hold('turnLeft', ['turn']); touch.apply(game); game.step(0.04);
    expect(game.periscopeYaw).toBeGreaterThan(0);
    game.firePlayerTorpedo();
    expect(game.playerTorpedoes[0].velocity.clone().normalize().distanceTo(game.currentDirection())).toBeLessThan(0.00001);
    game.resize(844, 390); expect(game.camera.aspect).toBe(844 / 390); expect(game.camera.fov).toBe(34);
    game.setView('starboard'); expect(game.currentDirection().x).toBe(1);
    const before = game.player.position.clone(); game.step(Number.NaN); game.step(-1);
    expect(game.player.position.equals(before)).toBe(true);
  });

  it('expires effects in game time and disposes each patrol’s resources independently', () => {
    const game = patrol(), next = patrol(); game.start();
    game.createBurst(game.player.position, '#ffffff'); game.pause(); game.step(10);
    expect(game.effects.bursts).toHaveLength(1);
    game.resume(); for (let i = 0; i < 10; i++) game.step(0.04);
    expect(game.effects.bursts).toHaveLength(0);
    const geometry = game.environment.floorChunks[0].geometry;
    const disposed = vi.fn(); geometry.addEventListener('dispose', disposed);
    const oldTexture = game.textures.get('sand');
    game.dispose(); game.dispose(); expect(disposed).toHaveBeenCalledOnce();
    next.start(); next.step(0.02); expect(next.active).toBe(true);
    expect(next.textures.get('sand')).not.toBe(oldTexture);
  });
});
