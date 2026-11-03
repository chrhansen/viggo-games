import * as THREE from 'three';
import { TorpedoGame } from './TorpedoGame.js';
import { VIEW_CONFIG } from './combatConfig.js';

export class OceanCombat extends TorpedoGame {
  constructor(canvas, hud, callbacks = {}) {
    super({
      ...callbacks,
      onChange: state => {
        hud.score.textContent = `Score ${state.score}`;
        hud.level.textContent = state.status;
        hud.health.textContent = `Hull ${state.hull}`;
        hud.charge.textContent = state.engineBroken ? 'Engine Hit' : state.ready ? 'Ready' : 'Reloading';
        hud.viewTitle.textContent = state.viewTitle;
        hud.windowFrame.className = `window-frame ${VIEW_CONFIG[state.view].frame}`;
        hud.periscopeMask.classList.toggle('active', state.view === 'periscope');
      },
      onDamage: () => {
        hud.damageFlash.classList.remove('hit');
        void hud.damageFlash.offsetWidth;
        hud.damageFlash.classList.add('hit');
      },
    });
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.clock = new THREE.Clock();
    this.frame = null;
    this.updateHud();
  }

  start() {
    super.start();
    if (this.frame !== null) return;
    this.clock.start();
    const animate = () => {
      if (this.disposed) return;
      this.step(this.clock.getDelta());
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(animate);
    };
    animate();
  }

  resume() { super.resume(); this.clock.getDelta(); }

  handleKeyDown(event) {
    this.keys.add(event.code);
    if (event.code === 'Digit1') this.setView('front');
    if (event.code === 'Digit2') this.setView('port');
    if (event.code === 'Digit3') this.setView('starboard');
    if (event.code === 'KeyP') this.togglePeriscope();
    if (event.code === 'KeyV') this.callbacks.onEnterInterior?.();
    if (event.code === 'Space') this.firePlayerTorpedo();
    if (event.code === 'KeyR' && this.isGameOver) this.restart();
  }

  handleKeyUp(event) { this.keys.delete(event.code); }

  resize() {
    const width = window.innerWidth || 1, height = window.innerHeight || 1;
    super.resize(width, height);
    this.renderer.setSize(width, height, false);
  }

  renderStill() { this.updateCamera(); this.renderer.render(this.scene, this.camera); }

  dispose() {
    cancelAnimationFrame(this.frame);
    super.dispose();
    this.renderer.dispose();
  }
}
