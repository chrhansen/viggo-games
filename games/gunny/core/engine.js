import { MISSION_KILLS, PLAYER_MUZZLE, RAIDER_MUZZLE, RAIDER_SCALE } from '../src/config.js';
import { BLAST_LIFETIME, raiderBlastDamage } from '../src/flight-effects.js';
import { advance, clamp, distance, lerp, muzzlePosition, vector } from './math.js';

export { MISSION_KILLS };
export const EXPLOSION_LIFETIME = 1.25;
export const IMPACT_LIFETIME = 0.42;
export const emptyGunnyInput = () => ({ left: false, right: false, up: false, down: false, fire: false });
export const isCriticalHull = state => state.started && !state.finished && state.health > 0 && Math.round(state.health) <= 10;

export class GunnyEngine {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.nextId = 0;
    this.reset();
  }

  reset() {
    this.state = { health: 100, score: 0, kills: 0, distance: 0, time: 0,
      active: false, started: false, finished: false, result: null };
    this.player = { position: vector(), rotation: vector(), scale: 1,
      velocity: vector(), cooldown: 0, damageFlash: 0 };
    this.enemies = [];
    this.satellites = [];
    this.playerShots = [];
    this.enemyShots = [];
    this.explosions = [];
    this.enemySpawnTimer = 1.1;
    this.satelliteSpawnTimer = 1.35;
  }

  start() { this.reset(); this.state.started = true; this.setActive(true); }
  setActive(active) { this.state.active = active && this.state.started && !this.state.finished; }
  get criticalHull() {
    return this.state.active && isCriticalHull(this.state);
  }

  step(delta, input = emptyGunnyInput()) {
    if (!this.state.active || !Number.isFinite(delta) || delta <= 0) return 0;
    delta = Math.min(delta, 0.033);
    this.state.time += delta;
    this.updatePlayer(delta, input);
    this.spawnWaves(delta);
    this.updateEnemies(delta);
    this.updateSatellites(delta);
    this.updateProjectiles(delta);
    this.updateExplosions(delta);
    this.checkMissionState();
    return delta;
  }

  updatePlayer(delta, input) {
    const p = this.player;
    p.velocity.x = lerp(p.velocity.x, (Number(input.right) - Number(input.left)) * 26, 0.12);
    p.velocity.y = lerp(p.velocity.y, (Number(input.up) - Number(input.down)) * 26, 0.12);
    p.position.x = clamp(p.position.x + p.velocity.x * delta, -24, 24);
    p.position.y = clamp(p.position.y + p.velocity.y * delta, -14, 17);
    p.position.z -= 42 * delta;
    p.rotation = vector(p.velocity.y * 0.015, -p.velocity.x * 0.006, -p.velocity.x * 0.018);
    p.cooldown = Math.max(0, p.cooldown - delta);
    p.damageFlash = Math.max(0, p.damageFlash - delta * 2.8);
    if (input.fire && p.cooldown === 0) this.firePlayerShot();
    this.state.distance += 42 * delta * 3.4;
  }

  spawnWaves(delta) {
    this.enemySpawnTimer -= delta;
    this.satelliteSpawnTimer -= delta;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = lerp(2.4, 1.45, Math.min(this.state.kills / MISSION_KILLS, 0.75));
    }
    if (this.satelliteSpawnTimer <= 0) {
      this.spawnSatellite();
      this.satelliteSpawnTimer = 2.2 + this.random() * 1.4;
    }
  }

  spawnEnemy() {
    const r = this.random;
    this.enemies.push({ id: this.nextId++, position: vector((r() - 0.5) * 50,
      (r() - 0.5) * 28, this.player.position.z - (180 + r() * 170)),
      rotation: vector(0, Math.PI, 0), scale: RAIDER_SCALE, hp: 2, radius: 2.6,
      driftX: (r() - 0.5) * 8, driftY: (r() - 0.5) * 6,
      phase: r() * Math.PI * 2, fireCooldown: 0.8 + r() * 1.4 });
  }

  spawnSatellite() {
    const r = this.random;
    const scale = 0.85 + r() * 0.65;
    this.satellites.push({ id: this.nextId++, scale, radius: 3.8 * scale,
      position: vector((r() - 0.5) * 56, (r() - 0.5) * 34,
        this.player.position.z - (165 + r() * 210)),
      rotation: vector(r(), r(), r()), spin: vector((r() - 0.5) * 0.18,
        (r() - 0.5) * 0.18, (r() - 0.5) * 0.18) });
  }

  firePlayerShot() {
    const position = muzzlePosition(this.player, PLAYER_MUZZLE);
    position.x += this.player.velocity.x * 0.016;
    this.playerShots.push({ id: this.nextId++, position, velocity: vector(0, 0, -145), radius: 1.2 });
    this.player.cooldown = 0.16;
  }

  fireEnemyShot(enemy) {
    const position = muzzlePosition(enemy, RAIDER_MUZZLE);
    const length = distance(position, this.player.position) || 1;
    const velocity = vector();
    for (const axis of ['x', 'y', 'z']) velocity[axis] = (this.player.position[axis] - position[axis]) / length * 54;
    this.enemyShots.push({ id: this.nextId++, position, velocity, radius: 1.2 });
  }

  updateEnemies(delta) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const age = this.state.time + enemy.phase;
      enemy.position.x += (Math.sin(age * 1.8) * enemy.driftX - enemy.position.x * 0.08) * delta;
      enemy.position.y += (Math.cos(age * 1.4) * enemy.driftY - enemy.position.y * 0.05) * delta;
      enemy.rotation.z = Math.sin(age * 2.3) * 0.22;
      enemy.rotation.x = Math.cos(age * 2.1) * 0.14;
      enemy.fireCooldown -= delta;
      if (enemy.fireCooldown <= 0 && distance(enemy.position, this.player.position) < 105) {
        this.fireEnemyShot(enemy);
        enemy.fireCooldown = 1.8 + this.random() * 1.6;
      }
      if (enemy.position.z > this.player.position.z + 25) { this.enemies.splice(i, 1); continue; }
      if (distance(enemy.position, this.player.position) < enemy.radius + 2.5) {
        this.damagePlayer(28);
        this.spawnExplosion(enemy.position, 0xff8d52, 3.8, true);
        this.enemies.splice(i, 1);
      }
    }
  }

  updateSatellites(delta) {
    for (let i = this.satellites.length - 1; i >= 0; i--) {
      const satellite = this.satellites[i];
      advance(satellite.rotation, satellite.spin, delta);
      if (satellite.position.z > this.player.position.z + 30) { this.satellites.splice(i, 1); continue; }
      if (distance(satellite.position, this.player.position) < satellite.radius + 2.6) {
        this.damagePlayer(20);
        this.spawnExplosion(satellite.position, 0xffcc7d, 4.4);
        this.satellites.splice(i, 1);
      }
    }
  }

  updateProjectiles(delta) {
    for (let i = this.playerShots.length - 1; i >= 0; i--) {
      const shot = this.playerShots[i];
      advance(shot.position, shot.velocity, delta);
      const enemyIndex = this.enemies.findLastIndex(enemy => distance(shot.position, enemy.position) <= shot.radius + enemy.radius);
      if (enemyIndex >= 0) {
        const enemy = this.enemies[enemyIndex];
        enemy.hp--;
        this.spawnExplosion(shot.position, 0x8cf2ff, 1.4);
        this.playerShots.splice(i, 1);
        if (enemy.hp <= 0) {
          this.state.kills++;
          this.state.score += 150;
          this.spawnExplosion(enemy.position, 0xffb96e, 3.8, true);
          this.enemies.splice(enemyIndex, 1);
        }
      } else if (shot.position.z < this.player.position.z - 190) this.playerShots.splice(i, 1);
    }
    for (let i = this.enemyShots.length - 1; i >= 0; i--) {
      const shot = this.enemyShots[i];
      advance(shot.position, shot.velocity, delta);
      if (distance(shot.position, this.player.position) < shot.radius + 2.1) {
        this.damagePlayer(6);
        this.spawnExplosion(shot.position, 0xff7e5d, 1.7);
        this.enemyShots.splice(i, 1);
      } else if (shot.position.z > this.player.position.z + 20) this.enemyShots.splice(i, 1);
    }
  }

  spawnExplosion(position, color, scale, raiderBlast = false) {
    const large = scale >= 3;
    this.explosions.push({ id: this.nextId++, position: { ...position }, color, scale, large,
      age: 0, life: large ? EXPLOSION_LIFETIME : IMPACT_LIFETIME, raiderBlast, damagedPlayer: false });
  }

  updateExplosions(delta) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.age += delta;
      explosion.life -= delta;
      if (explosion.raiderBlast && !explosion.damagedPlayer) {
        const damage = raiderBlastDamage(distance(explosion.position, this.player.position), explosion.age);
        if (damage > 0) { this.damagePlayer(damage); explosion.damagedPlayer = true; }
      }
      if (explosion.life <= 0) this.explosions.splice(i, 1);
    }
  }

  damagePlayer(amount) { this.state.health = Math.max(0, this.state.health - amount); this.player.damageFlash = 1; }
  finishMission(won) {
    this.state.finished = true;
    this.state.active = false;
    this.state.result = won ? 'win' : 'lose';
  }
  checkMissionState() {
    if (this.state.health <= 0) this.finishMission(false);
    else if (this.state.kills >= MISSION_KILLS && !this.explosions.some(e => e.raiderBlast && e.age < BLAST_LIFETIME)) this.finishMission(true);
  }
}
