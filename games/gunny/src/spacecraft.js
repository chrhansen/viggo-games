import * as THREE from "three";
import { vehicleMaterials } from "./vehicle-materials.js";
import { part, box, strut, hullGeometry, plateGeometry, finGeometry, panelLines, bakeStructure } from "./vehicle-geometry.js";
import { getGlowTexture } from "./glow-texture.js";

const templates = {};
const exhaustMaterials = {};

function cockpit(structure, raider) {
  const m = vehicleMaterials();
  const z = raider ? -0.85 : -1.45;
  const length = raider ? 0.92 : 1.3;
  part(structure, new THREE.SphereGeometry(1, 24, 16), m.trim, [0, 0.48, z], [0, 0, 0], [0.63, 0.37, length + 0.1]);
  part(structure, new THREE.SphereGeometry(1, 24, 16), m.canopy, [0, 0.56, z - 0.05], [0, 0, 0], [0.55, 0.36, length]);
  const arch = [];
  for (let i = 0; i <= 16; i++) {
    const angle = Math.PI * i / 16;
    arch.push(new THREE.Vector3(Math.cos(angle) * 0.56, 0.56 + Math.sin(angle) * 0.36, z + 0.2));
  }
  part(structure, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 20, 0.028, 6, false), m.steel);
  strut(structure, m.trim, [0, 0.72, z - length * 0.88], [0, 0.91, z + 0.3], 0.025);
}

function engine(structure, glowGroup, x, z, raider) {
  const m = vehicleMaterials();
  part(structure, hullGeometry([
    [z - 2.4, 0.24, 0.24], [z - 1.9, 0.44, 0.42],
    [z - 0.5, 0.43, 0.4], [z, 0.34, 0.34],
  ]), raider ? m.trim : m.hull, [x, -0.05, 0]);
  part(structure, new THREE.CylinderGeometry(0.33, 0.39, 0.58, 24, 1, true), m.nozzle,
    [x, -0.05, z + 0.13], [Math.PI / 2, 0, 0]);
  for (const offset of [-0.12, 0.22]) {
    part(structure, new THREE.TorusGeometry(0.38, 0.045, 8, 24), m.steel, [x, -0.05, z + offset]);
  }
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    const dx = Math.cos(angle) * 0.37, dy = Math.sin(angle) * 0.37;
    strut(structure, m.steel, [x + dx, dy - 0.05, z - 0.12], [x + dx * 0.9, dy - 0.05, z + 0.35], 0.025);
  }
  const core = raider ? m.engineAmber : m.engineBlue;
  part(structure, new THREE.CircleGeometry(0.23, 24), core, [x, -0.05, z + 0.28]);
  const jet = new THREE.Group();
  jet.position.set(x, -0.05, z + 0.3);
  const key = raider ? "amber" : "blue";
  if (!exhaustMaterials[key]) {
    exhaustMaterials[key] = new THREE.SpriteMaterial({
      map: getGlowTexture(), color: raider ? 0xffa657 : 0x78bfff,
      transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false,
    });
  }
  const halo = new THREE.Sprite(exhaustMaterials[key]);
  halo.scale.set(0.95, 0.95, 1);
  halo.position.z = 0.08;
  jet.add(halo);
  const plumeMaterial = exhaustMaterials[`${key}-plume`] ??= new THREE.MeshBasicMaterial({
    color: raider ? 0xffa45f : 0x70baff, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  part(jet, new THREE.ConeGeometry(0.22, 1.6, 20, 1, true), plumeMaterial,
    [0, 0, 0.8], [Math.PI / 2, 0, 0]);
  glowGroup.add(jet);
}

function fighterWings(structure, raider) {
  const m = vehicleMaterials();
  const skin = raider ? m.raider : m.hull;
  const marking = raider ? m.redMarkings : m.markings;
  for (const side of [-1, 1]) {
    const outline = raider
      ? [[0.6, -1.3], [3.65, -2.0], [4.6, -1.1], [2.8, 2.25], [0.7, 1.6]]
      : [[0.6, -2.15], [1.5, -1.05], [5.1, 1.95], [5.25, 2.55], [1.0, 2.1]];
    part(structure, plateGeometry(outline.map(([x, z]) => [x * side, z]), 0.15), skin, [0, -0.12, 0]);
    const inset = raider
      ? [[1.55, -1.3], [3.45, -1.65], [3.95, -1.05], [2.3, 1.65], [1.45, 1.35]]
      : [[1.65, -0.65], [4.6, 1.9], [4.35, 2.12], [1.45, 1.65]];
    part(structure, plateGeometry(inset.map(([x, z]) => [x * side, z]), 0.018), m.trim, [0, -0.012, 0]);
    const stripe = raider
      ? [[2.9, -1.65], [3.13, -1.7], [2.4, 1.45], [2.17, 1.5]]
      : [[3.8, 1.08], [4.05, 1.3], [3.45, 2.13], [3.13, 2.09]];
    part(structure, plateGeometry(stripe.map(([x, z]) => [side * x, z]), 0.018), marking, [0, 0.023, 0]);
    const fin = part(structure, finGeometry([[0.65, 0.1], [1.1, 1.35], [1.75, 1.55], [2.7, 0.1]]), skin,
      [side * (raider ? 1.65 : 1.35), 0.12, 0]);
    fin.rotation.z = -side * 0.27;
    box(structure, m.trim, [0.18, 0.14, 1.8], [side * (raider ? 2.7 : 2.05), -0.17, -0.6]);
    part(structure, new THREE.CylinderGeometry(0.065, 0.09, 0.9, 12), m.steel,
      [side * (raider ? 2.7 : 2.05), -0.17, -1.75], [Math.PI / 2, 0, 0]);
    const tipX = raider ? 4.45 : 5.1;
    part(structure, new THREE.SphereGeometry(0.065, 8, 8), side < 0 ? m.navRed : m.navGreen,
      [side * tipX, 0.0, raider ? -1.12 : 2.27]);
    panelLines(structure, raider ? m.redSeam : m.seam, [
      [[side * 1.5, 0.1, 0.0], [side * 2.6, 0.1, 1.4], [side * 3.7, 0.1, 1.8]],
      [[side * 1.2, 0.1, 1.65], [side * 2.3, 0.1, 1.9]],
    ]);
  }
}

function buildCraft(raider) {
  const m = vehicleMaterials();
  const ship = new THREE.Group();
  const structure = new THREE.Group();
  const glow = new THREE.Group();
  glow.name = "engine-glow";
  part(structure, hullGeometry(raider ? [
    [-3.85, 0.05, 0.04], [-2.65, 0.55, 0.26], [-1.0, 0.87, 0.45],
    [0.6, 0.85, 0.45], [2.2, 0.65, 0.3], [2.65, 0.45, 0.2],
  ] : [
    [-4.95, 0.035, 0.04], [-4.2, 0.32, 0.19], [-2.6, 0.67, 0.4],
    [-0.7, 0.91, 0.51], [1.0, 0.83, 0.44], [2.65, 0.62, 0.32], [3.15, 0.52, 0.23],
  ]), raider ? m.raider : m.hull);
  box(structure, m.trim, [0.82, 0.24, raider ? 3.6 : 4.7], [0, -0.3, 0.0], 0.08);
  cockpit(structure, raider);
  fighterWings(structure, raider);
  for (const side of [-1, 1]) {
    engine(structure, glow, side * (raider ? 1.12 : 1.05), raider ? 2.7 : 3.0, raider);
    box(structure, m.nozzle, [0.38, 0.08, 1.0], [side * 0.55, 0.48, 0.8]);
    for (let i = 0; i < 5; i++) {
      box(structure, m.steel, [0.32, 0.055, 0.045], [side * 0.55, 0.53, 0.45 + i * 0.17], 0.008);
    }
  }
  box(structure, raider ? m.redMarkings : m.markings, [0.2, 0.025, 1.3], [0, 0.445, 1.1], 0.005);
  ship.add(bakeStructure(structure), glow);
  if (raider) {
    ship.scale.setScalar(0.82);
    ship.rotation.y = Math.PI;
  }
  return ship;
}

function createCraft(raider) {
  const key = raider ? "raider" : "player";
  templates[key] ??= buildCraft(raider);
  const ship = templates[key].clone(true);
  ship.userData.engineGlow = ship.getObjectByName("engine-glow");
  ship.userData.muzzle = [0, 0, raider ? -4.0 : -5.1];
  ship.userData.damageMaterials = [];
  if (!raider) {
    ship.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.material.emissive) return;
      mesh.material = mesh.material.clone();
      mesh.material.emissive.setHex(0xff3518);
      mesh.material.emissiveIntensity = 0;
      ship.userData.damageMaterials.push(mesh.material);
    });
  }
  return ship;
}

export function createPlayerShip() { return createCraft(false); }
export function createEnemyShip() { return createCraft(true); }

export function updateCraftAppearance(ship, time, damage = 0) {
  ship.userData.engineGlow.children.forEach((jet, index) => {
    jet.scale.z = 1 + Math.sin(time * 37 + index) * 0.08 + Math.sin(time * 19) * 0.04;
  });
  ship.userData.damageMaterials.forEach((material) => { material.emissiveIntensity = damage * 0.6; });
}
