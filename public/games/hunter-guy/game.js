import * as THREE from "three";
import { createPlayerControls } from "./player-controls.js";
import { createWeaponEffects } from "./weapon-effects.js";
import { createWeaponSoundEffects } from "./weapon-sfx.js";
import { createWildlife } from "./wildlife.js";

const WORLD_HALF = 180;
const PLAYER_HEIGHT = 1.8;
const HUNTER_COUNT = 5;
const TREE_COUNT = 540;
const PLAYER_CLEARING_RADIUS = 14;

const root = document.getElementById("game-root");
const overlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status-text");
const scoreText = document.getElementById("score");
const controlsText = document.getElementById("controls-text");
const beltButtons = Array.from(document.querySelectorAll(".belt-item"));
const touchDpad = document.getElementById("touch-dpad");
const dpadThumb = document.getElementById("dpad-thumb");
const fireBtn = document.getElementById("fire-btn");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fc3a3, 55, 320);

const camera = new THREE.PerspectiveCamera(
  72,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.rotation.order = "YXZ";
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);

const LOOK_RANGE_RADIANS = THREE.MathUtils.degToRad(15);

const hemiLight = new THREE.HemisphereLight(0xb9e0ff, 0x355426, 1.06);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
sun.position.set(70, 120, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.left = -190;
sun.shadow.camera.right = 190;
sun.shadow.camera.top = 190;
sun.shadow.camera.bottom = -190;
scene.add(sun);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(500, 32, 16),
  new THREE.MeshBasicMaterial({
    color: 0x9fc3a3,
    side: THREE.BackSide,
  })
);
scene.add(sky);

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
const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({
    color: 0x466f3c,
    roughness: 0.9,
    metalness: 0,
  })
);
terrain.receiveShadow = true;
scene.add(terrain);

const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x654124, roughness: 0.95 });
const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x2c6f33, roughness: 0.85 });

for (let i = 0; i < TREE_COUNT; i += 1) {
  const x = randomInWorld(8);
  const z = randomInWorld(8);
  if (Math.hypot(x, z) < PLAYER_CLEARING_RADIUS) {
    continue;
  }

  const h = THREE.MathUtils.randFloat(3.5, 8.7);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.4, h, 6),
    treeTrunkMat
  );
  const baseY = terrainHeight(x, z);
  trunk.position.set(x, baseY + h / 2, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(THREE.MathUtils.randFloat(1.8, 3.4), h * 0.92, 8),
    treeLeafMat
  );
  leaves.position.set(x, baseY + h + 1.6, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

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

const raycaster = new THREE.Raycaster();
const centerVector = new THREE.Vector2(0, 0);
const weaponEffects = createWeaponEffects(scene, camera);
const weaponSoundEffects = createWeaponSoundEffects();

function setMessage(text, seconds = 1.2) {
  statusText.textContent = text;
  messageTimer = seconds;
}

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

const controls = createPlayerControls({
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
});

const clock = new THREE.Clock();
let worldTime = 0;
camera.position.set(0, terrainHeight(0, 0) + PLAYER_HEIGHT, 0);
setWeapon("rifle");
controls.showStartPrompt();

function updateHunters(delta) {
  hunters.forEach((hunter) => {
    hunter.angle += hunter.speed * delta;
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

  controls.update(delta);
  wildlife.update(delta);
  updateHunters(delta);
  weaponEffects.update(delta, worldTime);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
