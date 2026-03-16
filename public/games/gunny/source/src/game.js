import * as THREE from "three";
import { MISSION_KILLS } from "./config.js";
import { createPlanet, createPlayerShip, createStars } from "./entities.js";
import { runtimeMethods } from "./mission-runtime.js";

export class GunnyGame {
  constructor(dom) {
    this.dom = dom;
    this.clock = new THREE.Clock();
    this.pointerFire = false;
    this.actions = new Set();
    this.touchPointers = new Map();
    this.enemySpawnTimer = 0;
    this.satelliteSpawnTimer = 0;
    this.waveIntensity = 1;

    this.setupRenderer();
    this.setupScene();
    this.bindEvents();
    this.resetMission();

    this.renderer.setAnimationLoop(this.animate);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.dom.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07131d, 0.0012);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2400
    );

    const hemi = new THREE.HemisphereLight(0x90d4ff, 0x09131d, 1.8);
    const sun = new THREE.DirectionalLight(0xfff2cc, 1.65);
    sun.position.set(-90, 60, -120);
    const rim = new THREE.PointLight(0x6ec5ff, 28, 300, 2);
    rim.position.set(-120, -50, -320);
    const cockpitFill = new THREE.PointLight(0x7fcfff, 10, 90, 2);
    cockpitFill.position.set(0, 8, 12);
    const forwardFill = new THREE.SpotLight(
      0xc7e6ff,
      120,
      240,
      Math.PI / 4.8,
      0.68,
      1.5
    );
    forwardFill.position.set(0, 5.4, 20);
    forwardFill.target.position.set(0, 0.8, -120);

    this.scene.add(hemi, sun, rim, cockpitFill, forwardFill, forwardFill.target);
    this.forwardFill = forwardFill;

    this.player = {
      mesh: createPlayerShip(),
      shots: [],
      velocity: new THREE.Vector3(),
      cooldown: 0,
      damageFlash: 0,
    };
    this.scene.add(this.player.mesh);

    this.starField = createStars();
    this.scene.add(this.starField);

    this.earth = createPlanet(58, "earth");
    this.earth.position.set(-150, -52, -430);
    this.scene.add(this.earth);

    this.moon = createPlanet(16, "moon");
    this.moon.position.set(-70, 45, -350);
    this.scene.add(this.moon);

    this.enemies = [];
    this.enemyShots = [];
    this.satellites = [];
    this.explosions = [];
  }

  bindEvents() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousedown", this.onPointerDown);
    window.addEventListener("mouseup", this.onPointerUp);
    window.addEventListener("blur", this.onBlur);

    this.dom.launchButton.addEventListener("click", this.startMission);
    this.dom.restartButton.addEventListener("click", this.startMission);

    this.dom.touchControls
      .querySelectorAll("[data-action]")
      .forEach((button) => this.bindTouchButton(button));
  }

  bindTouchButton(button) {
    const action = button.dataset.action;

    button.addEventListener("pointerdown", (event) => {
      button.setPointerCapture(event.pointerId);
      this.touchPointers.set(event.pointerId, action);
      this.setAction(action, true);
    });

    const release = (event) => {
      const pointerAction = this.touchPointers.get(event.pointerId);
      if (!pointerAction) {
        return;
      }

      this.touchPointers.delete(event.pointerId);
      this.setAction(pointerAction, false);
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }

  resetMission() {
    this.started = false;
    this.finished = false;
    this.result = null;
    this.pointerFire = false;
    this.actions.clear();
    this.touchPointers.clear();
    this.enemySpawnTimer = 1.1;
    this.satelliteSpawnTimer = 1.35;
    this.waveIntensity = 1;

    this.state = {
      health: 100,
      score: 0,
      kills: 0,
      distance: 0,
    };

    this.player.mesh.position.set(0, 0, 0);
    this.player.mesh.rotation.set(0, 0, 0);
    this.player.velocity.set(0, 0, 0);
    this.player.cooldown = 0;
    this.player.damageFlash = 0;
    this.clearDynamicObjects();
    this.updateBackdrop(0);
    this.camera.position.set(0, 4.2, 16);
    this.camera.lookAt(0, 1.1, -34);
    this.updateHud();
  }

  clearDynamicObjects() {
    this.player.shots.forEach(({ mesh }) => this.scene.remove(mesh));
    this.enemyShots.forEach(({ mesh }) => this.scene.remove(mesh));
    this.enemies.forEach(({ mesh }) => this.scene.remove(mesh));
    this.satellites.forEach(({ mesh }) => this.scene.remove(mesh));
    this.explosions.forEach(({ mesh }) => this.scene.remove(mesh));

    this.player.shots = [];
    this.enemyShots = [];
    this.enemies = [];
    this.satellites = [];
    this.explosions = [];
  }

  startMission = () => {
    this.dom.introPanel.classList.add("panel--hidden");
    this.dom.statusPanel.classList.add("panel--hidden");
    this.resetMission();
    this.started = true;
    this.clock.start();
  };

  onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  onKeyDown = (event) => {
    const action = this.mapKey(event.code);
    if (!action) {
      return;
    }

    event.preventDefault();
    this.setAction(action, true);
  };

  onKeyUp = (event) => {
    const action = this.mapKey(event.code);
    if (!action) {
      return;
    }

    event.preventDefault();
    this.setAction(action, false);
  };

  onPointerDown = () => {
    this.pointerFire = true;
  };

  onPointerUp = () => {
    this.pointerFire = false;
  };

  onBlur = () => {
    this.pointerFire = false;
    this.actions.clear();
    this.touchPointers.clear();
  };

  mapKey(code) {
    const mapping = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      Space: "fire",
    };

    return mapping[code];
  }

  setAction(action, active) {
    if (active) {
      this.actions.add(action);
    } else {
      this.actions.delete(action);
    }
  }

  animate = () => {
    const delta = Math.min(this.clock.getDelta() || 0.016, 0.033);

    if (this.started && !this.finished) {
      this.update(delta);
    } else {
      this.updateBackdrop(delta);
      this.updateCamera(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  finishMission(won) {
    this.finished = true;
    this.started = false;
    this.result = won ? "win" : "lose";

    this.dom.statusEyebrow.textContent = won ? "Mission clear" : "Hull breach";
    this.dom.statusTitle.textContent = won ? "Sector safe" : "Try another run";
    this.dom.statusMessage.textContent = won
      ? `Score ${this.state.score}. Earth still shining.`
      : `You clipped too much metal. Score ${this.state.score}.`;
    this.dom.statusPanel.classList.remove("panel--hidden");
  }

  updateHud() {
    this.dom.healthValue.textContent = `${Math.max(0, Math.round(this.state.health))}%`;
    this.dom.scoreValue.textContent = this.state.score.toString();
    this.dom.killsValue.textContent = `${this.state.kills} / ${MISSION_KILLS}`;
    this.dom.distanceValue.textContent = `${Math.round(this.state.distance)} km`;
  }

  removePlayerShot(index) {
    this.scene.remove(this.player.shots[index].mesh);
    this.player.shots.splice(index, 1);
  }

  removeEnemyShot(index) {
    this.scene.remove(this.enemyShots[index].mesh);
    this.enemyShots.splice(index, 1);
  }

  removeEnemy(index) {
    this.scene.remove(this.enemies[index].mesh);
    this.enemies.splice(index, 1);
  }

  removeSatellite(index) {
    this.scene.remove(this.satellites[index].mesh);
    this.satellites.splice(index, 1);
  }
}

Object.assign(GunnyGame.prototype, runtimeMethods);
