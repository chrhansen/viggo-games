import * as THREE from 'three';
import { BossLoop } from './bossLoop.js';
import { CombatInput } from './combatInput.js';
import { updatePlayerControls } from './combatControls.js';
import { createMeshLibrary, quaternionFacing } from './meshes.js';
import { createSurfaceTextures } from './surfaceTextures.js';
import { CombatEffects } from './combatEffects.js';
import { performInteriorAction as runInteriorAction } from './interiorActions.js';
import { createOceanEnvironment, updateOceanEnvironment } from './oceanEnvironment.js';
import { createHelperFormation, resetHelperFormation, updateHelperFormation } from './helperFormation.js';
import { FRONT_SPAWN_DISTANCE, FRONT_SPAWN_LANES, PLAYER_BOUNDS, PLAYER_MAX_HULL, VIEW_CONFIG } from './combatConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);

export class TorpedoGame {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.keys = new Set();
    this.view = 'front';
    this.running = false;
    this.paused = true;
    this.isGameOver = false;
    this.spawnTimer = 0;
    this.hitTimer = 0;
    this.periscopeYaw = 0;
    this.input = new CombatInput();

    this.player = {
      position: new THREE.Vector3(0, 0, 0),
      forwardSpeed: 9,
      engineBroken: false,
      hull: PLAYER_MAX_HULL,
      score: 0,
      cooldown: 0
    };

    this.enemies = [];
    this.playerTorpedoes = [];
    this.enemyTorpedoes = [];
    this.helpers = createHelperFormation();

    this.disposed = false;
    this.textures = createSurfaceTextures();
    this.meshes = createMeshLibrary(this.textures.get);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 260);
    this.setupScene();
    this.bossLoop = new BossLoop(this);
    this.effects = new CombatEffects(this.world);
    this.updateCamera();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#163b46');
    this.scene.fog = new THREE.FogExp2('#163b46', 0.012);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    const ambient = new THREE.HemisphereLight('#b4d1cf', '#263d39', 2.0);
    this.scene.add(ambient);

    const diffuseLight = new THREE.DirectionalLight('#c4d9d4', 2.3);
    diffuseLight.position.set(-28, 46, -18);
    this.scene.add(diffuseLight);

    this.environment = createOceanEnvironment(this.world, this.textures.get);
  }

  start() {
    if (this.disposed || this.isGameOver) return;
    this.running = true;
    this.paused = false;
    this.updateHud();
  }

  pause() {
    this.paused = true;
    this.keys.clear();
    this.clearTouchInput();
  }

  resume() {
    if (this.disposed || this.isGameOver || !this.running) return;
    this.paused = false;
  }

  startPatrol(bossesDefeated = 0) {
    if (this.disposed) return;
    this.restart(bossesDefeated);
    this.start();
    this.saveBossCount();
  }

  saveBossCount() {
    if (this.running && !this.disposed) this.callbacks.onSaveBossCount?.(this.bossLoop.bossesDefeated);
  }

  restart(bossesDefeated = 0) {
    for (const enemy of this.enemies) this.world.remove(enemy.mesh);
    for (const torpedo of this.playerTorpedoes) this.world.remove(torpedo.mesh);
    for (const torpedo of this.enemyTorpedoes) this.world.remove(torpedo.mesh);
    this.effects.clear();
    this.clearKeys();
    this.bossLoop.removeAll(bossesDefeated);

    this.enemies = [];
    this.playerTorpedoes = [];
    this.enemyTorpedoes = [];
    this.player.position.set(0, 0, 0);
    this.player.forwardSpeed = 9;
    this.player.engineBroken = false;
    this.player.hull = PLAYER_MAX_HULL;
    this.player.score = 0;
    this.player.cooldown = 0;
    this.spawnTimer = 0;
    this.hitTimer = 0;
    this.periscopeYaw = 0;
    resetHelperFormation(this.helpers);
    this.isGameOver = false;
    this.setView('front');
    this.updateHud();
  }

  togglePeriscope() {
    const nextView = this.view === 'periscope' ? 'front' : 'periscope';
    this.setView(nextView);
    return nextView;
  }

  clearKeys() {
    this.keys.clear();
    this.clearTouchInput();
  }

  setTouchInput(x, y) { this.input.setTouch(x, y); }

  clearTouchInput() { this.input.clearTouch(); }

  setMotionControl(enabled) { this.input.setMotionControl(enabled); }

  handleDeviceOrientation(event) { return this.input.handleDeviceOrientation(event); }

  setView(view) {
    if (!VIEW_CONFIG[view]) return;
    this.view = view;
    const config = VIEW_CONFIG[view];
    this.camera.fov = config.fov;
    this.camera.updateProjectionMatrix();
    this.updateHud();
  }

  resize(width, height) {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  get active() { return this.running && !this.paused && !this.isGameOver && !this.disposed; }

  step(delta) {
    if (this.disposed) return;
    if (this.active && Number.isFinite(delta) && delta > 0) this.update(Math.min(delta, 0.04));
    this.updateCamera();
  }

  update(delta) {
    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.hitTimer = Math.max(0, this.hitTimer - delta);

    this.player.position.z -= this.player.forwardSpeed * delta;
    updatePlayerControls(this, delta);
    updateOceanEnvironment(this.environment, this.player, delta);
    this.updateEnemies(delta);
    this.bossLoop.update(delta);
    updateHelperFormation(this.helpers, this.player, this.bossLoop.helperTargets(this.enemies), delta, (position, direction) => {
      this.fireHelperTorpedo(position, direction);
    });
    this.updateTorpedoes(delta);
    this.effects.update(delta);
    this.checkCollisions();
    this.updateHud();
  }

  updateEnemies(delta) {
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.bossLoop.canSpawnRegular()) {
      this.spawnEnemy();
      this.spawnTimer = randomBetween(1.7, 3.0);
    } else if (!this.bossLoop.canSpawnRegular()) {
      this.spawnTimer = Math.max(this.spawnTimer, 0.8);
    }

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.mesh.position.z += enemy.speed * delta;
      const toPlayer = this.player.position.clone().sub(enemy.mesh.position);
      const distance = toPlayer.length();
      const firingDirection = toPlayer.normalize();
      if (enemy.mesh.userData.propeller) {
        enemy.mesh.userData.propeller.rotation.x += delta * 4.8;
      }
      enemy.shootTimer -= delta;

      if (enemy.shootTimer <= 0 && distance < 88 && this.isEnemyInFront(enemy)) {
        this.fireEnemyTorpedo(enemy.mesh.position, firingDirection);
        enemy.shootTimer = randomBetween(2.2, 3.8);
      }

      if (distance < 3.4) {
        this.damagePlayer(18);
        this.world.remove(enemy.mesh);
        this.enemies.splice(i, 1);
        continue;
      }

      if (enemy.mesh.position.distanceTo(this.player.position) > 180 || enemy.mesh.position.z > this.player.position.z + 60) {
        this.world.remove(enemy.mesh);
        this.enemies.splice(i, 1);
      }
    }
  }

  spawnEnemy() {
    const mesh = this.meshes.createEnemySubmarineMesh();
    const lane = FRONT_SPAWN_LANES[Math.floor(Math.random() * FRONT_SPAWN_LANES.length)];
    const distance = randomBetween(FRONT_SPAWN_DISTANCE[0], FRONT_SPAWN_DISTANCE[1]);
    mesh.position.set(
      clamp(this.player.position.x + lane + randomBetween(-2.8, 2.8), -PLAYER_BOUNDS.x + 4, PLAYER_BOUNDS.x - 4),
      randomBetween(-10, 11),
      this.player.position.z - distance
    );
    mesh.scale.setScalar(randomBetween(0.86, 1.15));
    mesh.quaternion.copy(quaternionFacing(new THREE.Vector3(0, 0, 1)));
    this.world.add(mesh);

    this.enemies.push({
      mesh,
      speed: randomBetween(5.0, 8.0) * (this.bossLoop.level > 1 ? 1.18 : 1),
      shootTimer: randomBetween(1.0, 2.3)
    });
  }

  isEnemyInFront(enemy) {
    return enemy.mesh.position.z < this.player.position.z - 10;
  }

  firePlayerTorpedo() {
    if (!this.active || this.player.cooldown > 0) return;
    const direction = this.currentDirection();
    const mesh = this.meshes.createTorpedoMesh('#f5d360', '#fff2a0');
    mesh.position.copy(this.player.position).addScaledVector(direction, 3.2);
    mesh.quaternion.copy(quaternionFacing(direction));
    this.world.add(mesh);

    this.playerTorpedoes.push({
      mesh,
      velocity: direction.multiplyScalar(48),
      life: 2.6
    });

    this.player.cooldown = 0.45;
  }

  fireEnemyTorpedo(position, direction) {
    const mesh = this.meshes.createTorpedoMesh('#ff5f56', '#ffd0c9');
    mesh.position.copy(position).addScaledVector(direction, 2.4);
    mesh.quaternion.copy(quaternionFacing(direction));
    this.world.add(mesh);

    this.enemyTorpedoes.push({
      mesh,
      velocity: direction.clone().multiplyScalar(28),
      life: 4.2
    });
  }

  fireHelperTorpedo(position, direction) {
    const mesh = this.meshes.createTorpedoMesh('#8fffe0', '#cafff2');
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternionFacing(direction));
    this.world.add(mesh);

    this.playerTorpedoes.push({
      mesh,
      velocity: direction.clone().multiplyScalar(54),
      life: 3.4
    });
  }

  updateTorpedoes(delta) {
    this.updateTorpedoList(this.playerTorpedoes, delta, 'player');
    this.updateTorpedoList(this.enemyTorpedoes, delta, 'enemy');
  }

  updateTorpedoList(list, delta, owner) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const torpedo = list[i];
      torpedo.mesh.position.addScaledVector(torpedo.velocity, delta);
      torpedo.life -= delta;
      torpedo.mesh.quaternion.copy(quaternionFacing(torpedo.velocity.clone().normalize()));
      torpedo.mesh.userData.propeller.rotation.x += delta * 24;
      this.effects.leaveTrail(torpedo);
      if (this.shouldRemoveTorpedo(torpedo, owner)) {
        this.world.remove(torpedo.mesh);
        list.splice(i, 1);
      }
    }
  }

  shouldRemoveTorpedo(torpedo, owner) {
    if (torpedo.life <= 0 || torpedo.mesh.position.distanceTo(this.player.position) > 160) {
      return true;
    }

    return owner === 'enemy' && torpedo.mesh.position.z > this.player.position.z + 3;
  }

  checkCollisions() {
    for (let t = this.playerTorpedoes.length - 1; t >= 0; t -= 1) {
      const torpedo = this.playerTorpedoes[t];
      if (this.bossLoop.hitBoss(torpedo)) {
        this.world.remove(torpedo.mesh);
        this.playerTorpedoes.splice(t, 1);
        continue;
      }

      for (let e = this.enemies.length - 1; e >= 0; e -= 1) {
        const enemy = this.enemies[e];
        if (torpedo.mesh.position.distanceTo(enemy.mesh.position) < 2.25) {
          this.createBurst(enemy.mesh.position, '#f6d56d');
          this.world.remove(torpedo.mesh);
          this.world.remove(enemy.mesh);
          this.playerTorpedoes.splice(t, 1);
          this.enemies.splice(e, 1);
          this.player.score += 100;
          this.bossLoop.recordRegularKill();
          break;
        }
      }
    }

    for (let i = this.enemyTorpedoes.length - 1; i >= 0; i -= 1) {
      const torpedo = this.enemyTorpedoes[i];
      if (torpedo.mesh.position.distanceTo(this.player.position) < 2.0) {
        this.createBurst(this.player.position, '#ff847f');
        this.world.remove(torpedo.mesh);
        this.enemyTorpedoes.splice(i, 1);
        this.damagePlayer(12);
      }
    }
  }

  createBurst(position, color) { this.effects.createBurst(position, color); }

  damagePlayer(amount) {
    if (this.hitTimer > 0) return;
    this.player.hull = Math.max(0, this.player.hull - amount);
    if (this.player.hull <= 55 && Math.random() < 0.35) {
      this.player.engineBroken = true;
      this.player.forwardSpeed = 4;
    }
    this.hitTimer = 0.55;
    this.callbacks.onDamage?.();

    if (this.player.hull <= 0) {
      this.isGameOver = true;
      this.clearKeys();
      this.callbacks.onGameOver?.();
    }
  }

  getSnapshot() {
    return {
      started: this.running, active: this.active, gameOver: this.isGameOver,
      bossesDefeated: this.bossLoop.bossesDefeated,
      score: this.player.score, hull: this.player.hull, maxHull: PLAYER_MAX_HULL,
      engineBroken: this.player.engineBroken, ready: this.player.cooldown <= 0,
      view: this.view, viewTitle: VIEW_CONFIG[this.view].title,
      status: this.bossLoop.statusText(), hit: this.hitTimer > 0,
    };
  }

  updateHud() { this.callbacks.onChange?.(this.getSnapshot()); }

  dispose() {
    if (this.disposed) return;
    this.pause();
    this.disposed = true;
    this.effects.dispose();
    const resources = new Set();
    this.scene.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      if (object.material) {
        for (const material of [object.material].flat()) resources.add(material);
      }
    });
    for (const resource of resources) resource.dispose();
    this.meshes.dispose();
    this.textures.dispose();
    this.scene.clear();
  }

  performInteriorAction(action) {
    return runInteriorAction(this, action);
  }

  updateCamera() {
    const direction = this.currentDirection();
    const cameraHeight = this.view === 'periscope' ? 3.2 : 0;

    this.camera.position.copy(this.player.position);
    this.camera.position.y += cameraHeight;
    this.camera.lookAt(this.camera.position.clone().add(direction));
  }

  currentDirection() {
    const base = VIEW_CONFIG[this.view].direction.clone();
    if (this.view !== 'periscope') return base.normalize();

    return base.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.periscopeYaw).normalize();
  }
}
