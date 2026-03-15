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

type RoadSample = {
  position: Vector3;
  surfaceHeight: number;
};

const ROAD_WIDTH = 14;
const EYE_HEIGHT = 1.45;
const MAX_CAMERA_ROLL = 0.1;
const TURN_RATE = 1.55;
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
        <p>W/S or arrows for speed. A/D or arrows to steer. Ride anywhere on the map.</p>
      </div>
      <div class="meter">
        <span>Speed</span>
        <strong data-speed>0 km/h</strong>
      </div>
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

if (!canvas || !speedValue || !titlePanel || !dismissTitleButton) {
  throw new Error('UI elements missing.');
}

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

  const steerInput = Number(input.right) - Number(input.left);
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
