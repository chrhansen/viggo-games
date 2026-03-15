import * as THREE from "three";
import { MISSION_KILLS } from "./config.js";
import {
  createEnemyShip,
  createExplosion,
  createProjectile,
  createSatellite,
} from "./entities.js";

export const runtimeMethods = {
  update(delta) {
    this.waveIntensity = 1 + Math.min(this.state.kills / MISSION_KILLS, 0.75);

    this.updatePlayer(delta);
    this.spawnWaves(delta);
    this.updateEnemies(delta);
    this.updateSatellites(delta);
    this.updateProjectiles(delta);
    this.updateExplosions(delta);
    this.updateBackdrop(delta);
    this.updateCamera(delta);
    this.updateHud();
    this.checkMissionState();
  },

  updatePlayer(delta) {
    const inputX = Number(this.actions.has("right")) - Number(this.actions.has("left"));
    const inputY = Number(this.actions.has("up")) - Number(this.actions.has("down"));
    const speed = 26;
    const forwardSpeed = 42;

    this.player.velocity.x = THREE.MathUtils.lerp(
      this.player.velocity.x,
      inputX * speed,
      0.12
    );
    this.player.velocity.y = THREE.MathUtils.lerp(
      this.player.velocity.y,
      inputY * speed,
      0.12
    );

    this.player.mesh.position.x = THREE.MathUtils.clamp(
      this.player.mesh.position.x + this.player.velocity.x * delta,
      -24,
      24
    );
    this.player.mesh.position.y = THREE.MathUtils.clamp(
      this.player.mesh.position.y + this.player.velocity.y * delta,
      -14,
      17
    );
    this.player.mesh.position.z -= forwardSpeed * delta;

    this.player.mesh.rotation.z = -this.player.velocity.x * 0.018;
    this.player.mesh.rotation.x = this.player.velocity.y * 0.015;
    this.player.mesh.rotation.y = -this.player.velocity.x * 0.006;

    const pulse = 1 + Math.sin(performance.now() * 0.015) * 0.14;
    this.player.mesh.userData.engineGlow.scale.setScalar(pulse * 1.2);

    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.player.damageFlash = Math.max(0, this.player.damageFlash - delta * 2.8);
    this.player.mesh.traverse((node) => {
      if (node.isMesh && node.material?.emissive) {
        node.material.emissiveIntensity = 1 + this.player.damageFlash * 2.4;
      }
    });

    if ((this.actions.has("fire") || this.pointerFire) && this.player.cooldown === 0) {
      this.firePlayerShot();
    }

    this.state.distance += forwardSpeed * delta * 3.4;
  },

  updateCamera(delta) {
    const cameraTarget = new THREE.Vector3(
      this.player.mesh.position.x * 0.22,
      this.player.mesh.position.y * 0.18 + 4.2,
      this.player.mesh.position.z + 16
    );

    this.camera.position.lerp(cameraTarget, 0.08 + delta);
    this.camera.lookAt(
      this.player.mesh.position.x,
      this.player.mesh.position.y + 1.1,
      this.player.mesh.position.z - 34
    );
  },

  updateBackdrop(delta) {
    const playerZ = this.player.mesh.position.z;

    this.starField.position.z = playerZ * 0.12;
    this.starField.rotation.z += delta * 0.005;

    this.earth.position.z = playerZ - 430;
    this.earth.rotation.y += delta * 0.03;
    this.moon.position.z = playerZ - 350;
    this.moon.rotation.y += delta * 0.02;
  },

  spawnWaves(delta) {
    this.enemySpawnTimer -= delta;
    this.satelliteSpawnTimer -= delta;

    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = THREE.MathUtils.lerp(
        1.5,
        0.8,
        Math.min(this.waveIntensity - 1, 0.75)
      );
    }

    if (this.satelliteSpawnTimer <= 0) {
      this.spawnSatellite();
      this.satelliteSpawnTimer = 1.2 + Math.random() * 0.9;
    }
  },

  spawnEnemy() {
    const mesh = createEnemyShip();
    mesh.position.set(
      (Math.random() - 0.5) * 44,
      (Math.random() - 0.5) * 24,
      this.player.mesh.position.z - (140 + Math.random() * 120)
    );
    this.scene.add(mesh);

    this.enemies.push({
      mesh,
      hp: 2,
      radius: 2.6,
      driftX: (Math.random() - 0.5) * 8,
      driftY: (Math.random() - 0.5) * 6,
      phase: Math.random() * Math.PI * 2,
      fireCooldown: 0.8 + Math.random() * 1.4,
    });
  },

  spawnSatellite() {
    const mesh = createSatellite();
    const scale = 0.85 + Math.random() * 0.65;
    mesh.scale.setScalar(scale);
    mesh.position.set(
      (Math.random() - 0.5) * 42,
      (Math.random() - 0.5) * 26,
      this.player.mesh.position.z - (110 + Math.random() * 140)
    );
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    this.scene.add(mesh);

    this.satellites.push({
      mesh,
      radius: 3.8 * scale,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      ),
    });
  },

  firePlayerShot() {
    const mesh = createProjectile(0x7af6ff, 0.3);
    mesh.position.copy(this.player.mesh.position);
    mesh.position.z -= 3.8;
    mesh.position.x += this.player.velocity.x * 0.016;
    this.scene.add(mesh);

    this.player.shots.push({
      mesh,
      velocity: new THREE.Vector3(0, 0, -145),
      radius: 1.2,
    });
    this.player.cooldown = 0.16;
  },

  fireEnemyShot(enemy) {
    const mesh = createProjectile(0xff925d, 0.38);
    mesh.position.copy(enemy.mesh.position);
    this.scene.add(mesh);

    const velocity = new THREE.Vector3()
      .subVectors(this.player.mesh.position, enemy.mesh.position)
      .normalize()
      .multiplyScalar(54);

    this.enemyShots.push({
      mesh,
      velocity,
      radius: 1.2,
    });
  },

  updateEnemies(delta) {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      const age = performance.now() * 0.001 + enemy.phase;

      enemy.mesh.position.x +=
        (Math.sin(age * 1.8) * enemy.driftX - enemy.mesh.position.x * 0.08) * delta;
      enemy.mesh.position.y +=
        (Math.cos(age * 1.4) * enemy.driftY - enemy.mesh.position.y * 0.05) * delta;

      enemy.mesh.rotation.z = Math.sin(age * 2.3) * 0.22;
      enemy.mesh.rotation.x = Math.cos(age * 2.1) * 0.14;

      enemy.fireCooldown -= delta;
      if (
        enemy.fireCooldown <= 0 &&
        enemy.mesh.position.distanceTo(this.player.mesh.position) < 125
      ) {
        this.fireEnemyShot(enemy);
        enemy.fireCooldown = 1.2 + Math.random() * 1.4;
      }

      if (enemy.mesh.position.z > this.player.mesh.position.z + 25) {
        this.removeEnemy(index);
        continue;
      }

      if (enemy.mesh.position.distanceTo(this.player.mesh.position) < enemy.radius + 2.5) {
        this.damagePlayer(28);
        this.spawnExplosion(enemy.mesh.position, 0xff8d52, 3.2);
        this.removeEnemy(index);
      }
    }
  },

  updateSatellites(delta) {
    for (let index = this.satellites.length - 1; index >= 0; index -= 1) {
      const satellite = this.satellites[index];
      satellite.mesh.rotation.x += satellite.spin.x * delta;
      satellite.mesh.rotation.y += satellite.spin.y * delta;
      satellite.mesh.rotation.z += satellite.spin.z * delta;

      if (satellite.mesh.position.z > this.player.mesh.position.z + 30) {
        this.removeSatellite(index);
        continue;
      }

      if (
        satellite.mesh.position.distanceTo(this.player.mesh.position) <
        satellite.radius + 2.6
      ) {
        this.damagePlayer(42);
        this.spawnExplosion(satellite.mesh.position, 0xffcc7d, 4.4);
        this.removeSatellite(index);
      }
    }
  },

  updateProjectiles(delta) {
    for (let index = this.player.shots.length - 1; index >= 0; index -= 1) {
      const shot = this.player.shots[index];
      shot.mesh.position.addScaledVector(shot.velocity, delta);

      let hitEnemy = false;
      for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
        const enemy = this.enemies[enemyIndex];
        if (shot.mesh.position.distanceTo(enemy.mesh.position) > shot.radius + enemy.radius) {
          continue;
        }

        enemy.hp -= 1;
        hitEnemy = true;
        this.spawnExplosion(shot.mesh.position, 0x8cf2ff, 1.4);
        this.removePlayerShot(index);

        if (enemy.hp <= 0) {
          this.state.kills += 1;
          this.state.score += 150;
          this.spawnExplosion(enemy.mesh.position, 0xffb96e, 3.8);
          this.removeEnemy(enemyIndex);
        }
        break;
      }

      if (hitEnemy) {
        continue;
      }

      if (shot.mesh.position.z < this.player.mesh.position.z - 190) {
        this.removePlayerShot(index);
      }
    }

    for (let index = this.enemyShots.length - 1; index >= 0; index -= 1) {
      const shot = this.enemyShots[index];
      shot.mesh.position.addScaledVector(shot.velocity, delta);

      if (shot.mesh.position.distanceTo(this.player.mesh.position) < shot.radius + 2.1) {
        this.damagePlayer(12);
        this.spawnExplosion(shot.mesh.position, 0xff7e5d, 1.7);
        this.removeEnemyShot(index);
        continue;
      }

      if (shot.mesh.position.z > this.player.mesh.position.z + 20) {
        this.removeEnemyShot(index);
      }
    }
  },

  updateExplosions(delta) {
    for (let index = this.explosions.length - 1; index >= 0; index -= 1) {
      const explosion = this.explosions[index];
      explosion.life -= delta;
      explosion.mesh.scale.addScalar(delta * explosion.growth);
      explosion.mesh.material.opacity = Math.max(0, explosion.life * 1.4);
      explosion.mesh.rotation.x += delta * 2;
      explosion.mesh.rotation.y += delta * 1.4;

      if (explosion.life <= 0) {
        this.scene.remove(explosion.mesh);
        this.explosions.splice(index, 1);
      }
    }
  },

  damagePlayer(amount) {
    this.state.health = Math.max(0, this.state.health - amount);
    this.player.damageFlash = 1;
  },

  spawnExplosion(position, color, scale) {
    const mesh = createExplosion(color);
    mesh.position.copy(position);
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);
    this.explosions.push({
      mesh,
      life: 0.55,
      growth: scale * 2.4,
    });
  },

  checkMissionState() {
    if (this.state.health <= 0) {
      this.finishMission(false);
      return;
    }

    if (this.state.kills >= MISSION_KILLS) {
      this.finishMission(true);
    }
  },
};
