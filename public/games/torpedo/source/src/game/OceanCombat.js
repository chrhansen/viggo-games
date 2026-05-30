import * as THREE from 'three';
import { createSubmarineMesh, createTorpedoMesh, quaternionFacing } from './meshes.js';
import { createOceanEnvironment, updateOceanEnvironment } from './oceanEnvironment.js';
import { createHelperFormation, resetHelperFormation, updateHelperFormation } from './helperFormation.js';
import { FRONT_SPAWN_DISTANCE, FRONT_SPAWN_LANES, PLAYER_BOUNDS, PLAYER_DODGE_SPEED, VIEW_CONFIG } from './combatConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);

export class OceanCombat {
  constructor(canvas, hud, callbacks = {}) {
    this.canvas = canvas;
    this.hud = hud;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();
    this.keys = new Set();
    this.view = 'front';
    this.running = false;
    this.paused = false;
    this.isGameOver = false;
    this.spawnTimer = 0;
    this.hitTimer = 0;
    this.periscopeYaw = 0;

    this.player = {
      position: new THREE.Vector3(0, 0, 0),
      forwardSpeed: 9,
      engineBroken: false,
      hull: 100,
      score: 0,
      cooldown: 0
    };

    this.enemies = [];
    this.playerTorpedoes = [];
    this.enemyTorpedoes = [];
    this.trailBubbles = [];
    this.helpers = createHelperFormation();

    this.setupRenderer();
    this.setupScene();
    this.updateHud();
    this.animate = this.animate.bind(this);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 260);
    this.camera.position.set(0, 0, 0);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#08364b');
    this.scene.fog = new THREE.FogExp2('#0b4a63', 0.014);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    const ambient = new THREE.HemisphereLight('#8edfff', '#062936', 2.2);
    this.scene.add(ambient);

    const sunShaft = new THREE.DirectionalLight('#b4f3ff', 2.8);
    sunShaft.position.set(-28, 46, -18);
    this.scene.add(sunShaft);

    this.environment = createOceanEnvironment(this.world);
    this.trailMaterial = new THREE.MeshBasicMaterial({ color: '#d5fbff', transparent: true, opacity: 0.58 });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.clock.start();
    this.animate();
  }

  pause() {
    this.paused = true;
    this.keys.clear();
  }

  resume() {
    if (this.isGameOver) return;
    this.paused = false;
    this.clock.getDelta();
  }

  restart() {
    for (const enemy of this.enemies) this.world.remove(enemy.mesh);
    for (const torpedo of this.playerTorpedoes) this.world.remove(torpedo.mesh);
    for (const torpedo of this.enemyTorpedoes) this.world.remove(torpedo.mesh);
    for (const bubble of this.trailBubbles) this.world.remove(bubble);

    this.enemies = [];
    this.playerTorpedoes = [];
    this.enemyTorpedoes = [];
    this.trailBubbles = [];
    this.player.position.set(0, 0, 0);
    this.player.forwardSpeed = 9;
    this.player.engineBroken = false;
    this.player.hull = 100;
    this.player.score = 0;
    this.player.cooldown = 0;
    this.spawnTimer = 0;
    this.hitTimer = 0;
    resetHelperFormation(this.helpers);
    this.isGameOver = false;
    this.setView('front');
    this.updateHud();
  }

  handleKeyDown(event) {
    this.keys.add(event.code);

    if (event.code === 'Digit1') this.setView('front');
    if (event.code === 'Digit2') this.setView('port');
    if (event.code === 'Digit3') this.setView('starboard');
    if (event.code === 'KeyP') this.setView(this.view === 'periscope' ? 'front' : 'periscope');
    if (event.code === 'KeyV') this.callbacks.onEnterInterior?.();
    if (event.code === 'Space') this.firePlayerTorpedo();
    if (event.code === 'KeyR' && this.isGameOver) this.restart();
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  clearKeys() {
    this.keys.clear();
  }

  setView(view) {
    if (!VIEW_CONFIG[view]) return;
    this.view = view;
    const config = VIEW_CONFIG[view];
    this.camera.fov = config.fov;
    this.camera.updateProjectionMatrix();
    this.hud.viewTitle.textContent = config.title;
    this.hud.windowFrame.className = `window-frame ${config.frame}`;
    this.hud.periscopeMask.classList.toggle('active', view === 'periscope');
  }

  resize() {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  renderStill() {
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.04);
    if (!this.paused && !this.isGameOver) {
      this.update(delta);
    }
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  update(delta) {
    this.player.cooldown = Math.max(0, this.player.cooldown - delta);
    this.hitTimer = Math.max(0, this.hitTimer - delta);

    this.player.position.z -= this.player.forwardSpeed * delta;
    this.updateControls(delta);
    updateOceanEnvironment(this.environment, this.player, delta);
    this.updateEnemies(delta);
    updateHelperFormation(this.helpers, this.player, this.enemies, delta, (position, direction) => {
      this.fireHelperTorpedo(position, direction);
    });
    this.updateTorpedoes(delta);
    this.updateTrailBubbles(delta);
    this.checkCollisions();
    this.updateHud();
  }

  updateControls(delta) {
    const speed = PLAYER_DODGE_SPEED;
    let moveX = 0;
    let moveY = 0;

    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) moveX -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) moveX += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) moveY += 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) moveY -= 1;

    if (this.view === 'periscope') {
      if (this.keys.has('KeyQ')) this.periscopeYaw += delta * 1.4;
      if (this.keys.has('KeyE')) this.periscopeYaw -= delta * 1.4;
    }

    const length = Math.hypot(moveX, moveY) || 1;
    this.player.position.x = clamp(
      this.player.position.x + (moveX / length) * speed * delta,
      -PLAYER_BOUNDS.x,
      PLAYER_BOUNDS.x
    );
    this.player.position.y = clamp(
      this.player.position.y + (moveY / length) * speed * delta,
      -PLAYER_BOUNDS.y,
      PLAYER_BOUNDS.y
    );
  }

  updateEnemies(delta) {
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = randomBetween(1.7, 3.0);
    }

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const toPlayer = this.player.position.clone().sub(enemy.mesh.position);
      const distance = toPlayer.length();
      const direction = toPlayer.normalize();
      enemy.mesh.position.addScaledVector(direction, enemy.speed * delta);
      enemy.mesh.quaternion.copy(quaternionFacing(direction));
      enemy.mesh.children[0].rotation.x += delta * 2.6;
      enemy.shootTimer -= delta;

      if (enemy.shootTimer <= 0 && distance < 88 && this.isEnemyInFront(enemy)) {
        this.fireEnemyTorpedo(enemy.mesh.position, direction);
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
    const mesh = createSubmarineMesh();
    const lane = FRONT_SPAWN_LANES[Math.floor(Math.random() * FRONT_SPAWN_LANES.length)];
    const distance = randomBetween(FRONT_SPAWN_DISTANCE[0], FRONT_SPAWN_DISTANCE[1]);
    mesh.position.set(
      clamp(this.player.position.x + lane + randomBetween(-2.8, 2.8), -PLAYER_BOUNDS.x + 4, PLAYER_BOUNDS.x - 4),
      randomBetween(-10, 11),
      this.player.position.z - distance
    );
    mesh.scale.setScalar(randomBetween(0.86, 1.15));
    this.world.add(mesh);

    this.enemies.push({
      mesh,
      speed: randomBetween(5.0, 8.0),
      shootTimer: randomBetween(1.0, 2.3)
    });
  }

  isEnemyInFront(enemy) {
    return enemy.mesh.position.z < this.player.position.z - 10;
  }

  firePlayerTorpedo() {
    if (this.isGameOver || this.paused || this.player.cooldown > 0) return;
    const direction = this.currentDirection();
    const mesh = createTorpedoMesh('#f5d360', '#fff2a0');
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
    const mesh = createTorpedoMesh('#ff5f56', '#ffd0c9');
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
    const mesh = createTorpedoMesh('#8fffe0', '#cafff2');
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
      this.leaveTorpedoTrail(torpedo);
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

  leaveTorpedoTrail(torpedo) {
    if (Math.random() > 0.45) return;
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(randomBetween(0.04, 0.11), 7, 7), this.trailMaterial);
    const backward = torpedo.velocity.clone().normalize().multiplyScalar(-0.9);
    bubble.position.copy(torpedo.mesh.position).add(backward);
    bubble.userData.life = 0.75;
    this.trailBubbles.push(bubble);
    this.world.add(bubble);
  }

  updateTrailBubbles(delta) {
    for (let i = this.trailBubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.trailBubbles[i];
      bubble.userData.life -= delta;
      bubble.position.y += delta * 1.4;
      bubble.scale.multiplyScalar(1 + delta * 1.6);
      if (bubble.userData.life <= 0) {
        this.world.remove(bubble);
        this.trailBubbles.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (let t = this.playerTorpedoes.length - 1; t >= 0; t -= 1) {
      const torpedo = this.playerTorpedoes[t];
      for (let e = this.enemies.length - 1; e >= 0; e -= 1) {
        const enemy = this.enemies[e];
        if (torpedo.mesh.position.distanceTo(enemy.mesh.position) < 2.25) {
          this.createBurst(enemy.mesh.position, '#f6d56d');
          this.world.remove(torpedo.mesh);
          this.world.remove(enemy.mesh);
          this.playerTorpedoes.splice(t, 1);
          this.enemies.splice(e, 1);
          this.player.score += 100;
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

  createBurst(position, color) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72
    });
    const burst = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), material);
    burst.position.copy(position);
    this.world.add(burst);

    const start = performance.now();
    const grow = () => {
      const age = (performance.now() - start) / 360;
      burst.scale.setScalar(1 + age * 4.6);
      material.opacity = Math.max(0, 0.72 - age);
      if (age < 0.72) {
        requestAnimationFrame(grow);
      } else {
        this.world.remove(burst);
        material.dispose();
      }
    };
    grow();
  }

  damagePlayer(amount) {
    if (this.hitTimer > 0) return;
    this.player.hull = Math.max(0, this.player.hull - amount);
    if (this.player.hull <= 55 && Math.random() < 0.35) {
      this.player.engineBroken = true;
      this.player.forwardSpeed = 4;
    }
    this.hitTimer = 0.55;
    this.hud.damageFlash.classList.remove('hit');
    void this.hud.damageFlash.offsetWidth;
    this.hud.damageFlash.classList.add('hit');

    if (this.player.hull <= 0) {
      this.isGameOver = true;
      this.keys.clear();
      this.callbacks.onGameOver?.();
    }
  }

  updateHud() {
    this.hud.score.textContent = `Score ${this.player.score}`;
    this.hud.health.textContent = `Hull ${this.player.hull}`;
    this.hud.charge.textContent = this.player.engineBroken
      ? 'Engine Hit'
      : this.player.cooldown <= 0 ? 'Ready' : 'Reloading';
  }

  performInteriorAction(action) {
    if (action === 'steer') return 'Holding course';
    if (action === 'repair') {
      if (!this.player.engineBroken) return 'Engine running';
      this.player.engineBroken = false;
      this.player.forwardSpeed = 9;
      this.player.hull = Math.min(100, this.player.hull + 8);
      this.updateHud();
      return 'Engine repaired';
    }
    if (action === 'rest') {
      this.player.hull = Math.min(100, this.player.hull + 4);
      this.updateHud();
      return 'Nap complete';
    }
    if (action === 'eat') return 'Lunch finished';
    if (action === 'sonar') {
      this.spawnTimer = Math.max(this.spawnTimer, 2.2);
      return `${this.enemies.length} contacts`;
    }
    return 'Ready';
  }

  updateCamera() {
    const config = VIEW_CONFIG[this.view];
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
