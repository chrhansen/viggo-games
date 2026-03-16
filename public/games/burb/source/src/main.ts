import './style.css';
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  createGround,
  createHandlebars,
  createMountains,
  createRoad,
  createScenery,
  createSky,
  fitHandlebarRig,
  GROUND_LEVEL,
  ROAD_SURFACE_LIFT,
} from './sceneBuilders';

type InputState = {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
};

type SensorPermissionResult = 'granted' | 'denied';

type DeviceMotionConstructorWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<SensorPermissionResult>;
};

type RoadSample = {
  position: Vector3;
  surfaceHeight: number;
};

type TiltSteeringState = {
  enabled: boolean;
  pending: boolean;
  permission: SensorPermissionResult | 'idle' | 'unsupported';
  neutralAngle: number | null;
  currentAngle: number | null;
  targetSteer: number;
  smoothSteer: number;
  lastSampleAt: number;
};

const ROAD_WIDTH = 14;
const EYE_HEIGHT = 1.45;
const MAX_CAMERA_ROLL = 0.1;
const TURN_RATE = 1.55;
const TILT_DEAD_ZONE = 4;
const TILT_FULL_STEER = 36;
const TILT_MIN_GRAVITY_PROJECTION = 5.5;
const TILT_SAMPLE_TIMEOUT_MS = 220;
const UP = new Vector3(0, 1, 0);
const lookMatrix = new Matrix4();

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

const scene = new Scene();
scene.background = new Color('#87bfe8');
scene.fog = new Fog('#87bfe8', 70, 380);

const camera = new PerspectiveCamera(
  74,
  window.innerWidth / window.innerHeight,
  0.1,
  1200,
);
scene.add(camera);

const hemi = new HemisphereLight('#d8efff', '#31541f', 1.8);
scene.add(hemi);

const sun = new DirectionalLight('#fff3d8', 2.2);
sun.position.set(90, 120, 40);
scene.add(sun);
scene.add(createSky());

const roadPoints = [
  [0, 0],
  [20, 28],
  [58, 64],
  [108, 54],
  [146, 6],
  [136, -52],
  [92, -92],
  [28, -86],
  [-22, -54],
  [-72, -70],
  [-128, -36],
  [-146, 30],
  [-116, 92],
  [-56, 118],
  [8, 96],
  [54, 132],
  [112, 162],
  [170, 126],
  [192, 58],
  [170, -16],
  [118, -82],
  [42, -126],
  [-42, -118],
  [-118, -88],
  [-188, -12],
  [-174, 82],
  [-100, 150],
  [-6, 176],
  [88, 154],
].map(([x, z]) => new Vector3(x, GROUND_LEVEL, z));

const curve = new CatmullRomCurve3(roadPoints, true, 'centripetal', 0.45);
const startProgress = 0.02;
const startPoint = curve.getPointAt(startProgress);
const startTangent = curve.getTangentAt(startProgress).normalize();
const roadSamples = buildRoadSamples(curve, 720);

scene.add(createGround(renderer.capabilities.getMaxAnisotropy()));
scene.add(createRoad(curve, renderer.capabilities.getMaxAnisotropy()));
scene.add(createScenery(curve));
scene.add(createMountains());

const handlebarRig = createHandlebars();
fitHandlebarRig(handlebarRig, EYE_HEIGHT);
camera.add(handlebarRig.group);

const input: InputState = {
  accelerate: false,
  brake: false,
  left: false,
  right: false,
};

const keyMap: Record<string, keyof InputState> = {
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
  smoothSteer: 0,
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

const state = {
  elapsed: 0,
  speed: 12,
  heading: Math.atan2(startTangent.x, startTangent.z),
  roll: 0,
  steer: 0,
  position: startPoint.clone(),
};

const clock = new Clock();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  state.elapsed += delta;

  const touchSteerInput = Number(input.right) - Number(input.left);
  if (tiltSteering.enabled && performance.now() - tiltSteering.lastSampleAt > TILT_SAMPLE_TIMEOUT_MS) {
    tiltSteering.targetSteer = 0;
  }

  tiltSteering.smoothSteer = MathUtils.damp(
    tiltSteering.smoothSteer,
    tiltSteering.targetSteer,
    9,
    delta,
  );

  const steerInput = touchSteerInput !== 0 ? touchSteerInput : tiltSteering.smoothSteer;
  const throttleInput = Number(input.accelerate) - Number(input.brake);
  const targetSpeed = MathUtils.clamp(12 + throttleInput * 6.5, 5, 20);
  state.steer = MathUtils.damp(state.steer, steerInput, 6.5, delta);
  state.speed = MathUtils.damp(state.speed, targetSpeed, 3.6, delta);
  state.heading = MathUtils.euclideanModulo(
    state.heading - state.steer * TURN_RATE * delta,
    Math.PI * 2,
  );
  state.roll = MathUtils.damp(
    state.roll,
    MathUtils.clamp(-state.steer * 0.08, -MAX_CAMERA_ROLL, MAX_CAMERA_ROLL),
    7.2,
    delta,
  );

  const bobPhase = state.elapsed * (state.speed * 1.18);
  const bobLift = Math.sin(bobPhase) * 0.03;
  const bobSide = Math.sin(bobPhase * 0.5) * 0.018;
  const bikeForward = new Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  const renderRight = new Vector3().crossVectors(UP, bikeForward).normalize();
  state.position.addScaledVector(bikeForward, state.speed * delta);
  state.position.y = getSurfaceHeight(state.position, roadSamples);

  camera.position
    .copy(state.position)
    .addScaledVector(renderRight, bobSide)
    .addScaledVector(UP, EYE_HEIGHT + bobLift);

  lookMatrix.lookAt(camera.position, camera.position.clone().add(bikeForward), UP);
  camera.quaternion.setFromRotationMatrix(lookMatrix);
  camera.rotateZ(-state.roll);

  handlebarRig.group.rotation.set(0, 0, 0);
  handlebarRig.steerPivot.rotation.set(0, -state.steer * 0.42, 0);
  handlebarRig.group.position.x = handlebarRig.restPosition.x + bobSide * 0.35;
  handlebarRig.group.position.y = handlebarRig.restPosition.y + bobLift * 0.22;
  handlebarRig.group.position.z = handlebarRig.restPosition.z;

  const targetFov = 74 + (state.speed - 12) * 0.75;
  camera.fov = MathUtils.damp(camera.fov, targetFov, 3.2, delta);
  camera.updateProjectionMatrix();

  speedValue.textContent = `${Math.round(state.speed * 3.6)} km/h`;
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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
    tiltSteering.smoothSteer = 0;
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
  tiltSteering.smoothSteer = 0;

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
  tiltSteering.smoothSteer = 0;
  syncTiltUi('Orientation changed. Hold phone upright to recenter tilt.');
}

function handleDeviceMotion(event: DeviceMotionEvent) {
  const gravity = event.accelerationIncludingGravity;

  if (!gravity) {
    return;
  }

  const tiltAngle = getTiltAngle(gravity);

  if (tiltAngle === null) {
    return;
  }

  tiltSteering.currentAngle = tiltAngle;
  tiltSteering.lastSampleAt = performance.now();

  if (tiltSteering.neutralAngle === null) {
    tiltSteering.neutralAngle = tiltAngle;
    syncTiltUi('Tilt steer on. Lean left or right to carve.');
  }

  const tiltOffset = getSignedAngleDelta(tiltAngle, tiltSteering.neutralAngle);
  tiltSteering.targetSteer = mapTiltAngleToSteer(tiltOffset);
}

function getTiltAngle(gravity: DeviceMotionEventAcceleration) {
  if (
    gravity.x === null ||
    gravity.y === null
  ) {
    return null;
  }

  const screenAngle = MathUtils.degToRad(getScreenAngle());
  const screenX = gravity.x * Math.cos(screenAngle) - gravity.y * Math.sin(screenAngle);
  const screenY = gravity.x * Math.sin(screenAngle) + gravity.y * Math.cos(screenAngle);
  const projectedGravity = Math.hypot(screenX, screenY);

  if (projectedGravity < TILT_MIN_GRAVITY_PROJECTION) {
    return null;
  }

  return MathUtils.radToDeg(Math.atan2(screenX, -screenY));
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

function getSignedAngleDelta(angle: number, baseline: number) {
  return MathUtils.euclideanModulo(angle - baseline + 180, 360) - 180;
}

function mapTiltAngleToSteer(tiltAngle: number) {
  const clampedTilt = MathUtils.clamp(tiltAngle, -TILT_FULL_STEER, TILT_FULL_STEER);
  const absTilt = Math.abs(clampedTilt);

  if (absTilt <= TILT_DEAD_ZONE) {
    return 0;
  }

  return (
    ((absTilt - TILT_DEAD_ZONE) / (TILT_FULL_STEER - TILT_DEAD_ZONE)) *
    Math.sign(clampedTilt)
  );
}

function buildRoadSamples(curvePath: CatmullRomCurve3, sampleCount: number) {
  const samples: RoadSample[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const point = curvePath.getPointAt(index / sampleCount);
    samples.push({
      position: point,
      surfaceHeight: point.y + ROAD_SURFACE_LIFT,
    });
  }

  return samples;
}

function getSurfaceHeight(worldPosition: Vector3, roadSamplePoints: RoadSample[]) {
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;
  let nearestRoadHeight = 0;

  for (const sample of roadSamplePoints) {
    const dx = worldPosition.x - sample.position.x;
    const dz = worldPosition.z - sample.position.z;
    const distanceSquared = dx * dx + dz * dz;

    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestRoadHeight = sample.surfaceHeight;
    }
  }

  const nearestDistance = Math.sqrt(nearestDistanceSquared);
  const roadBlend = 1 - MathUtils.smoothstep(nearestDistance, ROAD_WIDTH * 0.45, ROAD_WIDTH * 0.95);
  return MathUtils.lerp(GROUND_LEVEL, nearestRoadHeight, roadBlend);
}
