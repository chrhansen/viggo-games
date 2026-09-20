import * as THREE from 'three';
import { createEnemySubmarineMesh, quaternionFacing } from './meshes.js';
import { PLAYER_BOUNDS } from './combatConfig.js';

const BOSSES_PER_LEVEL = 5;
const PICKUP_SCORE = 350;
const BOSS_SCORE = 500;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);
const yawAxis = new THREE.Vector3(0, 1, 0);

export class BossLoop {
  constructor(combat) {
    this.combat = combat;
    this.reset();
  }

  reset() {
    this.level = 1;
    this.bossesDefeated = 0;
    this.regularKills = 0;
    this.waitingForPickup = false;
    this.boss = null;
    this.pickups = [];
  }

  removeAll() {
    if (this.boss) this.combat.world.remove(this.boss.mesh);
    for (const pickup of this.pickups) this.combat.world.remove(pickup.mesh);
    this.reset();
  }

  canSpawnRegular() {
    return !this.boss && !this.waitingForPickup;
  }

  helperTargets(enemies) {
    return this.boss ? [this.boss] : enemies;
  }

  recordRegularKill() {
    if (this.canSpawnRegular() && this.bossesDefeated < BOSSES_PER_LEVEL) {
      this.regularKills += 1;
    }
  }

  update(delta) {
    this.updatePickupSubs(delta);
    if (!this.boss && !this.waitingForPickup && this.regularKills >= this.regularKillsNeeded()) {
      this.spawnBoss();
    }
    if (this.boss) this.updateBoss(delta);
  }

  regularKillsNeeded() {
    if (this.bossesDefeated >= BOSSES_PER_LEVEL) return Number.POSITIVE_INFINITY;
    return 6 + this.bossesDefeated;
  }

  spawnBoss() {
    const mesh = createEnemySubmarineMesh();
    const lane = this.bossesDefeated % 2 === 0 ? -10 : 10;
    mesh.position.set(
      clamp(this.combat.player.position.x + lane + randomBetween(-4, 4), -PLAYER_BOUNDS.x + 8, PLAYER_BOUNDS.x - 8),
      randomBetween(-5, 6),
      this.combat.player.position.z - 118
    );
    mesh.scale.set(2.7, 2.35, 2.35);
    this.combat.world.add(mesh);

    const maxHealth = Math.floor(randomBetween(5, 10)) + this.bossesDefeated;
    this.boss = {
      mesh,
      health: maxHealth,
      maxHealth,
      speed: 2.3 + this.bossesDefeated * 0.16,
      shootTimer: 1.2,
      visualYaw: this.bossesDefeated % 2 === 0 ? 0.34 : -0.34,
      phase: randomBetween(0, Math.PI * 2)
    };
    this.regularKills = 0;
  }

  updateBoss(delta) {
    const toPlayer = this.combat.player.position.clone().sub(this.boss.mesh.position);
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    const visualDirection = direction.clone().applyAxisAngle(yawAxis, this.boss.visualYaw);
    this.boss.mesh.position.addScaledVector(direction, this.boss.speed * delta);
    this.boss.mesh.position.x += Math.sin(performance.now() * 0.0012 + this.boss.phase) * delta * 1.5;
    this.boss.mesh.quaternion.copy(quaternionFacing(visualDirection));
    this.boss.mesh.userData.propeller.rotation.x += delta * 7.2;
    this.boss.shootTimer -= delta;

    if (this.boss.shootTimer <= 0 && distance < 130) {
      this.fireBossSalvo(direction);
      this.boss.shootTimer = randomBetween(1.8, 3.0);
    }

    if (distance < 6.4) {
      this.combat.damagePlayer(24);
      this.boss.mesh.position.addScaledVector(direction, -10);
    }

    if (this.boss.mesh.position.z > this.combat.player.position.z + 34) {
      this.boss.mesh.position.z = this.combat.player.position.z - 104;
      this.boss.mesh.position.x = clamp(
        this.combat.player.position.x + randomBetween(-14, 14),
        -PLAYER_BOUNDS.x + 8,
        PLAYER_BOUNDS.x - 8
      );
    }
  }

  fireBossSalvo(direction) {
    for (const spread of [-0.16, 0, 0.16]) {
      const shotDirection = direction.clone().applyAxisAngle(yawAxis, spread).normalize();
      const position = this.boss.mesh.position.clone().addScaledVector(shotDirection, 7.2);
      this.combat.fireEnemyTorpedo(position, shotDirection);
    }
  }

  hitBoss(torpedo) {
    if (!this.boss || torpedo.mesh.position.distanceTo(this.boss.mesh.position) > 6.8) return false;

    this.boss.health -= 1;
    this.combat.createBurst(torpedo.mesh.position, this.boss.health <= 0 ? '#ffd875' : '#ff9f6e');
    if (this.boss.health <= 0) this.defeatBoss();
    return true;
  }

  defeatBoss() {
    const position = this.boss.mesh.position.clone();
    const rotation = this.boss.mesh.quaternion.clone();
    this.combat.world.remove(this.boss.mesh);
    this.combat.player.score += BOSS_SCORE;
    this.boss = null;
    this.bossesDefeated += 1;
    this.spawnPickupSub(position, rotation);
    this.waitingForPickup = true;
  }

  spawnPickupSub(position, rotation) {
    const mesh = createEnemySubmarineMesh();
    mesh.position.copy(position);
    mesh.quaternion.copy(rotation);
    mesh.scale.setScalar(0.42);
    this.pickups.push({ mesh, life: 18 });
    this.combat.world.add(mesh);
  }

  updatePickupSubs(delta) {
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = this.pickups[i];
      pickup.life -= delta;
      pickup.mesh.position.y = Math.max(-15.2, pickup.mesh.position.y - delta * 3.2);
      pickup.mesh.rotation.z += delta * 0.32;

      const dx = Math.abs(pickup.mesh.position.x - this.combat.player.position.x);
      const dz = Math.abs(pickup.mesh.position.z - this.combat.player.position.z);
      if (dx < 6 && dz < 8) {
        this.collectPickup(i);
      } else if (pickup.life <= 0 || pickup.mesh.position.z > this.combat.player.position.z + 45) {
        this.finishPickup(i);
      }
    }
  }

  collectPickup(index) {
    this.combat.player.score += PICKUP_SCORE;
    this.combat.createBurst(this.pickups[index].mesh.position, '#8fffe0');
    this.finishPickup(index);
  }

  finishPickup(index) {
    this.combat.world.remove(this.pickups[index].mesh);
    this.pickups.splice(index, 1);
    if (this.pickups.length) return;
    this.waitingForPickup = false;
    if (this.bossesDefeated >= BOSSES_PER_LEVEL) this.level = 2;
  }

  statusText() {
    if (this.boss) return `Boss ${this.boss.health}/${this.boss.maxHealth}`;
    if (this.waitingForPickup) return 'Prize Below';
    if (this.bossesDefeated < BOSSES_PER_LEVEL) return `Boss ${this.bossesDefeated}/${BOSSES_PER_LEVEL}`;
    return `Level ${this.level}`;
  }
}
