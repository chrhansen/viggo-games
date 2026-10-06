import * as THREE from 'three';
import { GunnyEngine, MISSION_KILLS, emptyGunnyInput, isCriticalHull } from '../core/engine.js';
import { createGunnyScene } from './scene.js';
import { loadPlanetTexture } from './browser-textures.js';
import { HullWarning } from './hull-warning.js';

export class GunnyGame {
  constructor(dom) {
    this.dom = dom;
    this.engine = new GunnyEngine();
    this.clock = new THREE.Clock();
    this.pointerFire = false;
    this.actions = new Set();
    this.touchPointers = new Map();
    this.hullWarning = new HullWarning();
    this.missionCardTimer = null;
    this.setupRenderer();
    this.setupScene();
    this.bindEvents();
    this.resetMission();
    this.renderer.setAnimationLoop(this.animate);
  }
  get state() { return this.engine.state; }
  get started() { return this.state.started && !this.state.finished; }
  set started(value) { this.state.started = value; }
  get finished() { return this.state.finished; }
  set finished(value) { this.state.finished = value; }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.dom.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  setupScene() {
    this.game = createGunnyScene({ aspect: window.innerWidth / window.innerHeight,
      loadTexture: loadPlanetTexture, renderer: this.renderer, engine: this.engine });
  }
  bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onPointerDown);
    window.addEventListener('mouseup', this.onPointerUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    this.dom.launchButton.addEventListener('click', this.startMission);
    this.dom.restartButton.addEventListener('click', this.startMission);
    this.dom.dismissTitleCard?.addEventListener('click', this.dismissMissionCard);
    this.dom.touchControls.querySelectorAll('[data-action]').forEach(button => this.bindTouchButton(button));
  }
  bindTouchButton(button) {
    const action = button.dataset.action;
    button.addEventListener('pointerdown', event => {
      button.setPointerCapture(event.pointerId);
      this.touchPointers.set(event.pointerId, action);
      this.setAction(action, true);
    });
    const release = event => {
      const action = this.touchPointers.get(event.pointerId);
      this.touchPointers.delete(event.pointerId);
      if (action && ![...this.touchPointers.values()].includes(action)) this.setAction(action, false);
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }
  resetMission() {
    this.engine.reset();
    this.onBlur();
    this.game?.resetCamera();
    this.updateHud();
  }
  startMission = () => {
    this.hullWarning.unlock();
    this.dom.introPanel.classList.add('panel--hidden');
    this.dom.statusPanel.classList.add('panel--hidden');
    this.resetMission();
    this.started = true;
    this.engine.setActive(true);
    this.clock.start();
    clearTimeout(this.missionCardTimer);
    if (window.matchMedia('(max-width: 760px), (pointer: coarse)').matches) {
      this.missionCardTimer = setTimeout(this.dismissMissionCard, 5000);
    }
  };
  dismissMissionCard = () => {
    clearTimeout(this.missionCardTimer);
    this.missionCardTimer = null;
    this.dom.missionCard?.classList.add('hud__block--hidden');
  };
  onResize = () => {
    this.game.resize(window.innerWidth, window.innerHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };
  onKeyDown = event => {
    const action = this.mapKey(event.code);
    if (action) { event.preventDefault(); this.setAction(action, true); }
  };
  onKeyUp = event => {
    const action = this.mapKey(event.code);
    if (action) { event.preventDefault(); this.setAction(action, false); }
  };
  onPointerDown = () => { this.pointerFire = true; };
  onPointerUp = () => { this.pointerFire = false; };
  onBlur = () => {
    this.pointerFire = false;
    this.actions.clear();
    this.touchPointers.clear();
    this.engine.setActive(false);
    this.hullWarning.update(false);
  };
  onFocus = () => { this.engine.setActive(true); this.clock.start(); };
  mapKey(code) {
    return { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'fire' }[code];
  }
  setAction(action, active) { if (active) this.actions.add(action); else this.actions.delete(action); }
  animate = () => {
    const input = emptyGunnyInput();
    for (const action of this.actions) input[action] = true;
    input.fire ||= this.pointerFire;
    const delta = this.clock.getDelta() || 0.016;
    if (this.state.active) this.game.step(delta, input);
    else if (!this.state.started || this.finished) this.game.preview(Math.min(delta, 0.033));
    if (this.finished && this.dom.statusPanel.classList.contains('panel--hidden')) this.showResult();
    this.updateHud();
    this.renderer.render(this.game.scene, this.game.camera);
  };
  showResult() {
    const won = this.state.result === 'win';
    this.dom.statusEyebrow.textContent = won ? 'Mission clear' : 'Hull breach';
    this.dom.statusTitle.textContent = won ? 'Sector safe' : 'Try another run';
    this.dom.statusMessage.textContent = won ? `Score ${this.state.score}. Earth still shining.`
      : `You clipped too much metal. Score ${this.state.score}.`;
    this.dom.statusPanel.classList.remove('panel--hidden');
  }
  updateHud() {
    const health = Math.max(0, Math.round(this.state.health));
    const critical = isCriticalHull({ ...this.state, started: this.started, finished: this.finished });
    this.dom.healthValue.closest('.stat').classList.toggle('stat--critical', critical);
    this.hullWarning.update(critical && !document.hidden && document.hasFocus());
    this.dom.healthValue.textContent = `${health}%`;
    this.dom.scoreValue.textContent = this.state.score.toString();
    this.dom.killsValue.textContent = `${this.state.kills} / ${MISSION_KILLS}`;
    this.dom.distanceValue.textContent = `${Math.round(this.state.distance)} km`;
  }
}
