import './style.css';
import { ACESFilmicToneMapping, Clock, MathUtils, SRGBColorSpace, WebGLRenderer } from 'three';
import { emptyBurbInput } from '../core/engine';
import { getGravityRollAngle, signedAngleDelta, mapTiltAngleToSteer } from '../core/tilt-steering';
import { createBurbScene } from './scene';
import { createBrowserBurbTexture } from './browser-textures';

type SensorPermissionResult = 'granted' | 'denied';

type DeviceMotionConstructorWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<SensorPermissionResult>;
};

type TiltSteeringState = {
  enabled: boolean;
  pending: boolean;
  permission: SensorPermissionResult | 'idle' | 'unsupported';
  neutralAngle: number | null;
  currentAngle: number | null;
  targetSteer: number;
  lastSampleAt: number;
};

const TILT_SAMPLE_TIMEOUT_MS = 220;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root missing.');
}

app.innerHTML = `
  <div class="shell">
    <canvas class="scene" aria-label="3D cycling game"></canvas>
    <div class="hud">
      <div class="badge">BURB RIDE</div>
      <div class="title">
        <button type="button" class="title-dismiss" data-dismiss-title aria-label="Dismiss help">X</button>
        <h1>Road loop. Bars up front. Fast corners.</h1>
        <p>W/S or arrows for speed. A/D or arrows to steer. Phone/tablet: tap tilt, lean 30-45 degrees, back upright to go straight.</p>
      </div>
      <div class="meter">
        <span>Speed</span>
        <strong data-speed>0 km/h</strong>
      </div>
    </div>
    <div class="motion-panel" data-tilt-panel hidden>
      <button type="button" class="motion-toggle" data-tilt-button>Enable tilt</button>
      <p class="motion-status" data-tilt-status aria-live="polite">Lean phone left or right to steer.</p>
    </div>
    <div class="touch-controls" aria-label="Touch controls">
      <button type="button" data-control="left">Left</button>
      <button type="button" data-control="slower">Slow</button>
      <button type="button" data-control="faster">Fast</button>
      <button type="button" data-control="right">Right</button>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('.scene');
const speedValue = document.querySelector<HTMLElement>('[data-speed]');
const titlePanel = document.querySelector<HTMLElement>('.title');
const dismissTitleButton = document.querySelector<HTMLButtonElement>('[data-dismiss-title]');
const tiltPanel = document.querySelector<HTMLElement>('[data-tilt-panel]');
const tiltButton = document.querySelector<HTMLButtonElement>('[data-tilt-button]');
const tiltStatus = document.querySelector<HTMLElement>('[data-tilt-status]');

if (!canvas || !speedValue || !titlePanel || !dismissTitleButton || !tiltPanel || !tiltButton || !tiltStatus) {
  throw new Error('UI elements missing.');
}

const tiltPanelElement = tiltPanel;
const tiltButtonElement = tiltButton;
const tiltStatusElement = tiltStatus;

dismissTitleButton.addEventListener('click', () => {
  titlePanel.remove();
});

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const game = createBurbScene({
  aspect: window.innerWidth / window.innerHeight,
  textures: createBrowserBurbTexture,
  anisotropy: renderer.capabilities.getMaxAnisotropy(),
});
game.engine.setActive(true);
const input = emptyBurbInput();

const keyMap: Record<string, Exclude<keyof typeof input, 'tilt'>> = {
  ArrowUp: 'accelerate',
  KeyW: 'accelerate',
  ArrowDown: 'brake',
  KeyS: 'brake',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

const supportsTouchTilt = hasTouchTiltSupport();
const showTiltUi = hasTouchScreen();
const tiltUnavailableReason = !window.isSecureContext
  ? 'Tilt needs HTTPS or localhost.'
  : typeof window.DeviceMotionEvent === 'undefined'
    ? 'Motion sensors unavailable in this browser.'
    : null;
const tiltSteering: TiltSteeringState = {
  enabled: false,
  pending: false,
  permission: supportsTouchTilt ? 'idle' : 'unsupported',
  neutralAngle: null,
  currentAngle: null,
  targetSteer: 0,
  lastSampleAt: 0,
};

window.addEventListener('keydown', (event) => updateKeyState(event, true));
window.addEventListener('keyup', (event) => updateKeyState(event, false));

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-control]')) {
  const control = button.dataset.control;
  const press = (active: boolean) => {
    if (control === 'faster') {
      input.accelerate = active;
    }
    if (control === 'slower') {
      input.brake = active;
    }
    if (control === 'left') {
      input.left = active;
    }
    if (control === 'right') {
      input.right = active;
    }
  };

  button.addEventListener('pointerdown', () => press(true));
  button.addEventListener('pointerup', () => press(false));
  button.addEventListener('pointerleave', () => press(false));
  button.addEventListener('pointercancel', () => press(false));
}

if (showTiltUi) {
  tiltPanelElement.hidden = false;
  tiltButtonElement.addEventListener('click', () => {
    if (tiltSteering.enabled) {
      recenterTiltSteering();
      return;
    }

    void enableTiltSteering();
  });

  syncTiltUi();

  if (supportsTouchTilt && 'orientation' in window) {
    window.addEventListener('orientationchange', handleTiltOrientationChange);
  }

  if (supportsTouchTilt) {
    screen.orientation?.addEventListener('change', handleTiltOrientationChange);
  }
}

const clock = new Clock();

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  if (tiltSteering.enabled && performance.now() - tiltSteering.lastSampleAt > TILT_SAMPLE_TIMEOUT_MS) {
    tiltSteering.targetSteer = 0;
  }
  input.tilt = tiltSteering.targetSteer;
  game.step(delta, input);
  speedValue.textContent = `${Math.round(game.engine.state.speed * 3.6)} km/h`;
  renderer.render(game.scene, game.camera);
});

function clearInput() {
  Object.assign(input, emptyBurbInput());
  tiltSteering.targetSteer = 0;
  game.engine.state.tiltSteer = 0;
}
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  clearInput();
  game.engine.setActive(!document.hidden);
  clock.getDelta();
});
window.addEventListener('resize', () => {
  game.resize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function updateKeyState(event: KeyboardEvent, active: boolean) {
  const control = keyMap[event.code];

  if (!control) {
    return;
  }

  event.preventDefault();
  input[control] = active;
}

function hasTouchScreen() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function hasTouchTiltSupport() {
  return hasTouchScreen() && window.isSecureContext && typeof window.DeviceMotionEvent !== 'undefined';
}

function getDeviceMotionConstructor() {
  return (window as Window & {
    DeviceMotionEvent?: DeviceMotionConstructorWithPermission;
  }).DeviceMotionEvent;
}

async function enableTiltSteering() {
  if (!supportsTouchTilt || tiltSteering.pending) {
    return;
  }

  tiltSteering.pending = true;
  syncTiltUi();

  let note = 'Hold phone upright for a moment to center tilt.';

  try {
    const deviceMotion = getDeviceMotionConstructor();
    if (typeof deviceMotion?.requestPermission === 'function') {
      const permission = await deviceMotion.requestPermission();

      if (permission !== 'granted') {
        tiltSteering.permission = 'denied';
        note = 'Motion access denied. Touch steering still works.';
        return;
      }
    }

    if (!tiltSteering.enabled) {
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      tiltSteering.enabled = true;
    }

    tiltSteering.permission = 'granted';
    tiltSteering.targetSteer = 0;
    game.engine.state.tiltSteer = 0;
    tiltSteering.neutralAngle = null;
    tiltSteering.currentAngle = null;
    tiltSteering.lastSampleAt = 0;
  } catch (error) {
    tiltSteering.permission = 'denied';
    note = `Motion access failed${error instanceof Error && error.message ? `: ${error.message}` : '.'}`;
  } finally {
    tiltSteering.pending = false;
    syncTiltUi(note);
  }
}

function recenterTiltSteering() {
  tiltSteering.neutralAngle = tiltSteering.currentAngle;
  tiltSteering.targetSteer = 0;
  game.engine.state.tiltSteer = 0;

  syncTiltUi(
    tiltSteering.neutralAngle === null
      ? 'Hold phone upright for a moment to center tilt.'
      : 'Tilt recentered. Lean 30-45 degrees to steer.',
  );
}

function syncTiltUi(note?: string) {
  if (!showTiltUi) {
    tiltPanelElement.hidden = true;
    return;
  }

  tiltPanelElement.hidden = false;

  if (!supportsTouchTilt) {
    tiltButtonElement.disabled = true;
    tiltButtonElement.textContent = 'Tilt unavailable';
    tiltStatusElement.textContent = tiltUnavailableReason ?? 'Tilt unavailable here.';
    return;
  }

  if (tiltSteering.pending) {
    tiltButtonElement.disabled = true;
    tiltButtonElement.textContent = 'Enabling tilt...';
  } else if (tiltSteering.enabled) {
    tiltButtonElement.disabled = false;
    tiltButtonElement.textContent = 'Recenter tilt';
  } else {
    tiltButtonElement.disabled = false;
    tiltButtonElement.textContent = tiltSteering.permission === 'denied' ? 'Retry tilt' : 'Enable tilt';
  }

  if (note) {
    tiltStatusElement.textContent = note;
    return;
  }

  if (tiltSteering.permission === 'denied') {
    tiltStatusElement.textContent = 'Motion access denied. Use touch buttons or retry tilt.';
    return;
  }

  if (tiltSteering.enabled && tiltSteering.neutralAngle === null) {
    tiltStatusElement.textContent = 'Hold phone upright. Neutral sets automatically.';
    return;
  }

  tiltStatusElement.textContent = 'Lean phone 30-45 degrees to steer. Back upright to go straight.';
}

function handleTiltOrientationChange() {
  if (!tiltSteering.enabled) {
    return;
  }

  tiltSteering.neutralAngle = null;
  tiltSteering.currentAngle = null;
  tiltSteering.targetSteer = 0;
  game.engine.state.tiltSteer = 0;
  syncTiltUi('Orientation changed. Hold phone upright to recenter tilt.');
}

function handleDeviceMotion(event: DeviceMotionEvent) {
  const gravity = event.accelerationIncludingGravity;

  if (!gravity) {
    return;
  }

  const tiltAngle = getGravityRollAngle(gravity, getScreenAngle());

  if (tiltAngle === null) {
    return;
  }

  tiltSteering.currentAngle = tiltAngle;
  tiltSteering.lastSampleAt = performance.now();

  if (tiltSteering.neutralAngle === null) {
    tiltSteering.neutralAngle = tiltAngle;
    syncTiltUi('Tilt steer on. Lean left or right to carve.');
  }

  const tiltOffset = signedAngleDelta(tiltAngle, tiltSteering.neutralAngle);
  tiltSteering.targetSteer = mapTiltAngleToSteer(tiltOffset);
}

function getScreenAngle() {
  if (typeof screen.orientation?.angle === 'number') {
    return screen.orientation.angle;
  }

  const legacyOrientation = (window as Window & { orientation?: number }).orientation;
  return typeof legacyOrientation === 'number'
    ? MathUtils.euclideanModulo(legacyOrientation, 360)
    : 0;
}
