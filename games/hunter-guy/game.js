import * as THREE from "three";
import { createPlayerControls } from "./player-controls.js";
import { createWeaponEffects } from "./weapon-effects.js";
import { createWeaponSoundEffects } from "./weapon-sfx.js";
import { createWildlife } from "./wildlife.js";
import { createForest, createSky } from "./forest.js";
import { createCollisionWorld, movingBodyCircles } from "./collisions.js";
import { natureTexture } from "./nature-materials.js";

const WORLD_HALF = 180;
const PLAYER_HEIGHT = 1.8;
const HUNTER_COUNT = 5;
const HUNTER_SPEED_SCALE = 0.4;
const TREE_COUNT = 540;
const PLAYER_CLEARING_RADIUS = 14;

const root = document.getElementById("game-root");
const overlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status-text");
const scoreText = document.getElementById("score");
const controlsCard = document.getElementById("controls-card");
const controlsCloseBtn = document.getElementById("controls-close");
const controlsText = document.getElementById("controls-text");
const beltButtons = Array.from(document.querySelectorAll(".belt-item"));
const touchDpad = document.getElementById("touch-dpad");
const dpadThumb = document.getElementById("dpad-thumb");
const fireBtn = document.getElementById("fire-btn");
const CONTROLS_CARD_TIMEOUT_MS = 10000;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb9ccca, 65, 290);

const camera = new THREE.PerspectiveCamera(
  72,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.rotation.order = "YXZ";
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
root.appendChild(renderer.domElement);

const LOOK_RANGE_RADIANS = THREE.MathUtils.degToRad(15);

const hemiLight = new THREE.HemisphereLight(0xc3d9ed, 0x5b6040, 1.8);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffe3b0, 2.5);
sun.position.set(-45, 65, -35);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48;
sun.shadow.camera.bottom = -48;
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.035;
scene.add(sun);
scene.add(sun.target);

createSky(scene);

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.014) * 2.1 +
    Math.cos(z * 0.011) * 1.5 +
    Math.sin((x + z) * 0.009) * 1.3
  );
}

function clampToWorld(obj) {
  obj.position.x = THREE.MathUtils.clamp(obj.position.x, -WORLD_HALF, WORLD_HALF);
  obj.position.z = THREE.MathUtils.clamp(obj.position.z, -WORLD_HALF, WORLD_HALF);
}

function randomInWorld(pad = 20) {
  return THREE.MathUtils.randFloatSpread((WORLD_HALF - pad) * 2);
}

const terrainGeo = new THREE.PlaneGeometry(420, 420, 88, 88);
terrainGeo.rotateX(-Math.PI / 2);
const terrainPos = terrainGeo.attributes.position;
for (let i = 0; i < terrainPos.count; i += 1) {
  const x = terrainPos.getX(i);
  const z = terrainPos.getZ(i);
  terrainPos.setY(i, terrainHeight(x, z));
}
terrainGeo.computeVertexNormals();
const groundTexture = natureTexture("ground");
groundTexture.repeat.set(95, 95);
const groundColors = [];
const groundTint = new THREE.Color();
for (let i = 0; i < terrainPos.count; i++) {
  const x = terrainPos.getX(i), z = terrainPos.getZ(i);
  const path = Math.exp(-Math.pow((x - Math.sin(z * 0.032) * 8) / 3, 2));
  groundTint.set(0x5b6940).lerp(new THREE.Color(0x998369), path * 0.8);
  groundTint.multiplyScalar(0.88 + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.12);
  groundColors.push(groundTint.r, groundTint.g, groundTint.b);
}
terrainGeo.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({
    map: groundTexture,
    bumpMap: groundTexture,
    bumpScale: 0.08,
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
  })
);
terrain.receiveShadow = true;
scene.add(terrain);

const forest = createForest(scene, terrainHeight, TREE_COUNT, PLAYER_CLEARING_RADIUS);

const wildlife = createWildlife({
  scene,
  terrainHeight,
  randomInWorld,
  clampToWorld,
  worldHalf: WORLD_HALF,
});

const hunters = [];
const hunterMat = new THREE.MeshStandardMaterial({ color: 0x6f4f2f, roughness: 0.86 });
const jacketMat = new THREE.MeshStandardMaterial({ color: 0x3f5f2d, roughness: 0.9 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xe1b38c, roughness: 0.8 });

for (let i = 0; i < HUNTER_COUNT; i += 1) {
  const group = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.35), jacketMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  group.add(torso);

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.32), hunterMat);
  legs.position.y = 0.63;
  legs.castShadow = true;
  group.add(legs);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), skinMat);
  head.position.y = 2.18;
  head.castShadow = true;
  group.add(head);

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.17, 16),
    new THREE.MeshStandardMaterial({ color: 0x4a3622 })
  );
  hat.position.y = 2.34;
  group.add(hat);

  const patrolRadius = THREE.MathUtils.randFloat(18, 52);
  const center = new THREE.Vector2(randomInWorld(35), randomInWorld(35));

  scene.add(group);
  hunters.push({
    group,
    center,
    patrolRadius,
    angle: Math.random() * Math.PI * 2,
    speed: THREE.MathUtils.randFloat(0.22, 0.46),
  });
}

const weaponStats = {
  rifle: { name: "Rifle", cooldown: 0.24, range: 90 },
  bow: { name: "Bow", cooldown: 0.8, range: 70 },
  knife: { name: "Knife", cooldown: 0.38, range: 5 },
  squirt: { name: "Squirt Gun", cooldown: 0.18, range: 26 },
};

let selectedWeapon = "rifle";
let score = 0;
let fireCooldown = 0;
let messageTimer = 0;
let controlsCardTimer = null;
let controlsCardDismissed = false;

const raycaster = new THREE.Raycaster();
const centerVector = new THREE.Vector2(0, 0);
const weaponEffects = createWeaponEffects(scene, camera);
const weaponSoundEffects = createWeaponSoundEffects();

function setMessage(text, seconds = 1.2) {
  statusText.textContent = text;
  messageTimer = seconds;
}

function hideControlsCard() {
  controlsCard.classList.add("hidden");
}

function showControlsCard() {
  if (controlsCardDismissed) {
    return;
  }
  controlsCard.classList.remove("hidden");
}

function startControlsCardTimer() {
  if (controlsCardDismissed) {
    return;
  }
  showControlsCard();
  window.clearTimeout(controlsCardTimer);
  controlsCardTimer = window.setTimeout(() => {
    hideControlsCard();
  }, CONTROLS_CARD_TIMEOUT_MS);
}

controlsCloseBtn.addEventListener("click", () => {
  controlsCardDismissed = true;
  window.clearTimeout(controlsCardTimer);
  hideControlsCard();
});

function setWeapon(weaponName) {
  selectedWeapon = weaponName;
  beltButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.weapon === selectedWeapon);
  });
  weaponEffects.setWeapon(selectedWeapon);
  setMessage(`${weaponStats[selectedWeapon].name} ready`, 1.1);
}

beltButtons.forEach((button) => {
  button.addEventListener("click", () => setWeapon(button.dataset.weapon));
});

document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "Digit1":
      setWeapon("rifle");
      break;
    case "Digit2":
      setWeapon("bow");
      break;
    case "Digit3":
      setWeapon("knife");
      break;
    case "Digit4":
      setWeapon("squirt");
      break;
    default:
      break;
  }
});

function onAnimalTagged(animal, reasonText) {
  score += 1;
  scoreText.textContent = `Animals tagged: ${score}`;
  setMessage(reasonText.replace("{animal}", animal.name), 1.3);
}

function onAnimalWounded(animal, hp) {
  setMessage(`${animal.name} hit! ${hp} shot left.`, 1.1);
}

function tryUseWeapon() {
  weaponSoundEffects.warmup();
  if (!controls.isActive || fireCooldown > 0) {
    return;
  }

  const weapon = weaponStats[selectedWeapon];
  fireCooldown = weapon.cooldown;
  weaponEffects.fire(selectedWeapon);
  weaponSoundEffects.play(selectedWeapon);

  raycaster.setFromCamera(centerVector, camera);
  raycaster.far = weapon.range;

  const hit = raycaster
    .intersectObjects(wildlife.hitMeshes, false)
    .find((entry) => entry.object.userData.animal?.alive);
  const animal = hit?.object?.userData?.animal;

  if (selectedWeapon === "rifle") {
    if (animal) {
      const result = wildlife.applyDamage(animal, 1);
      if (result.killed) {
        onAnimalTagged(animal, "Rifle hit. {animal} tagged.");
      } else {
        onAnimalWounded(animal, result.hp);
      }
    } else {
      setMessage("Rifle shot missed.", 0.8);
    }
    return;
  }

  if (selectedWeapon === "bow") {
    if (animal) {
      const result = wildlife.applyDamage(animal, 1);
      if (result.killed) {
        onAnimalTagged(animal, "Bow hit. {animal} tagged.");
      } else {
        onAnimalWounded(animal, result.hp);
      }
    } else {
      setMessage("Arrow missed.", 0.8);
    }
    return;
  }

  if (selectedWeapon === "knife") {
    if (animal && hit.distance <= weapon.range) {
      const result = wildlife.applyDamage(animal, 1);
      if (result.killed) {
        onAnimalTagged(animal, "Knife close hit. {animal} tagged.");
      } else {
        onAnimalWounded(animal, result.hp);
      }
    } else {
      setMessage("Too far for knife.", 0.8);
    }
    return;
  }

  if (animal && wildlife.squirt(animal)) {
    setMessage(`Splash! ${animal.name} runs away.`, 0.9);
  } else {
    setMessage("Splash in the leaves.", 0.8);
  }
}

const collisions = createCollisionWorld(
  forest.colliders,
  () => movingBodyCircles(wildlife.animals, hunters),
  WORLD_HALF
);

const controls = createPlayerControls({
  movePlayer: (dx, dz) => collisions.move(camera.position, dx, dz),
  camera,
  renderer,
  overlay,
  startBtn,
  statusText,
  controlsText,
  touchDpad,
  dpadThumb,
  fireBtn,
  lookRangeRadians: LOOK_RANGE_RADIANS,
  terrainHeight,
  clampToWorld,
  playerHeight: PLAYER_HEIGHT,
  setMessage,
  warmupAudio: () => weaponSoundEffects.warmup(),
  onUseWeapon: tryUseWeapon,
  onSessionActiveChange: (active) => {
    if (active) {
      startControlsCardTimer();
      return;
    }
    window.clearTimeout(controlsCardTimer);
    showControlsCard();
  },
});

const clock = new THREE.Clock();
let worldTime = 0;
camera.position.set(0, terrainHeight(0, 0) + PLAYER_HEIGHT, 0);
setWeapon("rifle");
controls.showStartPrompt();

function updateHunters(delta) {
  hunters.forEach((hunter) => {
    hunter.angle += hunter.speed * HUNTER_SPEED_SCALE * delta;
    const x = hunter.center.x + Math.cos(hunter.angle) * hunter.patrolRadius;
    const z = hunter.center.y + Math.sin(hunter.angle) * hunter.patrolRadius;
    hunter.group.position.set(x, terrainHeight(x, z), z);
    hunter.group.rotation.y = -hunter.angle + Math.PI * 0.5;
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  worldTime += delta;

  if (fireCooldown > 0) {
    fireCooldown -= delta;
  }
  if (messageTimer > 0) {
    messageTimer -= delta;
    if (messageTimer <= 0) {
      statusText.textContent = `${weaponStats[selectedWeapon].name} ready`;
    }
  }

  wildlife.update(delta);
  updateHunters(delta);
  controls.update(delta);
  weaponEffects.update(delta, worldTime);

  forest.update(worldTime);
  sun.position.set(camera.position.x - 45, camera.position.y + 65, camera.position.z - 35);
  sun.target.position.copy(camera.position);
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
