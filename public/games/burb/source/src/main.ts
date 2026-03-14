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
} from './sceneBuilders';

type InputState = {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
};

const ROAD_WIDTH = 14;
const EYE_HEIGHT = 1.45;
const MAX_HEADING_OFFSET = 0.62;
const MAX_CAMERA_ROLL = 0.1;
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
        <h1>Road loop. Bars up front. Fast corners.</h1>
        <p>W/S or arrows for speed. A/D or arrows for lane position. Tap buttons on touch screens.</p>
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

if (!canvas || !speedValue) {
  throw new Error('UI elements missing.');
}

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
  new Vector3(0, 0, 0),
  new Vector3(20, 0.5, 28),
  new Vector3(58, 1.3, 64),
  new Vector3(108, 2.1, 54),
  new Vector3(146, 1.4, 6),
  new Vector3(136, 0.6, -52),
  new Vector3(92, 0, -92),
  new Vector3(28, 0.7, -86),
  new Vector3(-22, 1.6, -54),
  new Vector3(-72, 2.3, -70),
  new Vector3(-128, 1.1, -36),
  new Vector3(-146, 0.3, 30),
  new Vector3(-116, 0.9, 92),
  new Vector3(-56, 1.8, 118),
  new Vector3(8, 2.5, 96),
  new Vector3(54, 1.8, 132),
  new Vector3(112, 0.9, 162),
  new Vector3(170, 1.4, 126),
  new Vector3(192, 2, 58),
  new Vector3(170, 1.1, -16),
  new Vector3(118, 0.2, -82),
  new Vector3(42, -0.2, -126),
  new Vector3(-42, 0.4, -118),
  new Vector3(-118, 1.5, -88),
  new Vector3(-188, 1, -12),
  new Vector3(-174, 0.5, 82),
  new Vector3(-100, 1.4, 150),
  new Vector3(-6, 2.1, 176),
  new Vector3(88, 1.2, 154),
];

const curve = new CatmullRomCurve3(roadPoints, true, 'centripetal', 0.45);
const curveLength = curve.getLength();

scene.add(createGround(renderer.capabilities.getMaxAnisotropy()));
scene.add(createRoad(curve, renderer.capabilities.getMaxAnisotropy()));
scene.add(createScenery(curve));
scene.add(createMountains());

const handlebarRig = createHandlebars();
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
  progress: 0.02,
  speed: 12,
  laneOffset: 0,
  headingOffset: 0,
  roll: 0,
  steer: 0,
};

const clock = new Clock();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  state.elapsed += delta;

  const steerInput = Number(input.left) - Number(input.right);
  const throttleInput = Number(input.accelerate) - Number(input.brake);
  const targetSpeed = MathUtils.clamp(12 + throttleInput * 6.5, 5, 20);
  state.steer = MathUtils.damp(state.steer, steerInput, 6.5, delta);

  const offRoadDrag = MathUtils.clamp(
    Math.max(0, Math.abs(state.laneOffset) - ROAD_WIDTH * 0.5) / (ROAD_WIDTH * 0.9),
    0,
    0.45,
  );

  state.speed = MathUtils.damp(state.speed, targetSpeed * (1 - offRoadDrag), 3.6, delta);
  state.headingOffset = MathUtils.damp(
    state.headingOffset,
    state.steer * MAX_HEADING_OFFSET,
    5.4,
    delta,
  );
  state.laneOffset = MathUtils.damp(
    state.laneOffset,
    state.headingOffset * ROAD_WIDTH * 0.55,
    2.8,
    delta,
  );
  state.progress = MathUtils.euclideanModulo(
    state.progress +
      ((state.speed * Math.max(0.62, Math.cos(state.headingOffset))) * delta) / curveLength,
    1,
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
  const renderPoint = curve.getPointAt(state.progress);
  const renderTangent = curve.getTangentAt(state.progress).normalize();
  const renderRight = new Vector3().crossVectors(UP, renderTangent).normalize();
  const bikeForward = renderTangent.clone().applyAxisAngle(UP, state.headingOffset).normalize();

  camera.position
    .copy(renderPoint)
    .addScaledVector(renderRight, state.laneOffset + bobSide)
    .addScaledVector(UP, EYE_HEIGHT + bobLift);

  lookMatrix.lookAt(camera.position, camera.position.clone().add(bikeForward), UP);
  camera.quaternion.setFromRotationMatrix(lookMatrix);
  camera.rotateZ(-state.roll);

  handlebarRig.group.rotation.set(0, 0, 0);
  handlebarRig.steerPivot.rotation.set(0, state.steer * 0.42, 0);
  handlebarRig.group.position.y = -0.75 + bobLift * 0.22;
  handlebarRig.group.position.x = bobSide * 0.35;

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
