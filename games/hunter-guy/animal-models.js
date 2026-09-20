import * as THREE from "three";
import { natureTexture } from "./nature-materials.js";

const sphere = new THREE.SphereGeometry(1, 10, 8);
let furTexture;
const materials = new Map();
function coat(color) {
  if (!furTexture) {
    furTexture = natureTexture("fur");
    furTexture.repeat.set(3, 2);
  }
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({
    color, map: furTexture, bumpMap: furTexture, bumpScale: 0.012, roughness: 0.96,
  }));
  return materials.get(color);
}
const black = new THREE.MeshStandardMaterial({ color: 0x17140f, roughness: 0.33 });
const eye = new THREE.MeshStandardMaterial({ color: 0x160d06, roughness: 0.13 });
const ivory = new THREE.MeshStandardMaterial({ color: 0xb9aa87, roughness: 0.8 });

function ellipsoid(parent, material, position, scale) {
  const mesh = new THREE.Mesh(sphere, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function bone(parent, material, from, to, radius, tip = radius * 0.65) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(tip, radius, start.distanceTo(end), 7), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
function face(parent, x, y, width, eyeSize) {
  for (const side of [-1, 1]) {
    ellipsoid(parent, black, [x, y, side * width], [eyeSize * 1.45, eyeSize * 1.25, eyeSize * 0.7]);
    ellipsoid(parent, eye, [x + 0.006, y + 0.005, side * (width + eyeSize * 0.4)], [eyeSize, eyeSize, eyeSize * 0.7]);
    ellipsoid(parent, ivory, [x + eyeSize * 0.25, y + eyeSize * 0.3, side * (width + eyeSize)], [eyeSize * 0.2, eyeSize * 0.2, eyeSize * 0.12]);
  }
}
function legs(group, material, x, width, height, thickness, hoofMaterial) {
  const pivots = [];
  for (const front of [-1, 1]) {
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(front * x, height, side * width);
      group.add(pivot);
      ellipsoid(pivot, material, [0, -height * 0.25, 0], [thickness * 1.3, height * 0.35, thickness]);
      bone(pivot, material, [0, -height * 0.35, 0], [front * -0.06, -height + 0.11, 0], thickness * 0.65, thickness * 0.45);
      ellipsoid(pivot, hoofMaterial, [0.045, -height + 0.085, 0], [thickness * 1.12, 0.085, thickness * 0.95]);
      pivots.push(pivot);
    }
  }
  group.userData.legs = pivots;
}
function finish(group, body, head) {
  group.userData.head = head;
  group.userData.headRest = head.rotation.z;
  group.userData.body = body;
  group.userData.bodyHeight = body.position.y;
  const hitMeshes = [];
  group.traverse((child) => { if (child.isMesh) hitMeshes.push(child); });
  return { group, hitMeshes };
}

export function buildFox() {
  const group = new THREE.Group();
  const orange = coat(0xc86b2e), dark = coat(0x493b30), white = coat(0xf4e4c8);
  const body = ellipsoid(group, orange, [0, 0.66, 0], [0.72, 0.3, 0.26]);
  ellipsoid(group, white, [0.34, 0.56, 0], [0.35, 0.24, 0.23]);
  ellipsoid(group, dark, [-0.13, 0.85, 0], [0.48, 0.09, 0.19]);
  legs(group, orange, 0.43, 0.17, 0.54, 0.075, dark);
  const head = new THREE.Group();
  head.position.set(0.58, 0.83, 0);
  group.add(head);
  ellipsoid(head, orange, [0.1, 0, 0], [0.29, 0.22, 0.22]);
  ellipsoid(head, white, [0.25, -0.09, 0], [0.26, 0.105, 0.145]);
  ellipsoid(head, orange, [0.31, -0.02, 0], [0.23, 0.1, 0.12]);
  ellipsoid(head, black, [0.51, -0.015, 0], [0.058, 0.046, 0.075]);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.34, 4), dark);
    ear.position.set(0.02, 0.27, side * 0.145);
    ear.rotation.x = side * 0.2;
    head.add(ear);
    const inner = ear.clone();
    inner.material = orange;
    inner.scale.set(0.66, 0.75, 0.66);
    inner.position.x += 0.04;
    head.add(inner);
  }
  face(head, 0.2, 0.055, 0.19, 0.034);
  const tail = new THREE.Group();
  tail.position.set(-0.56, 0.72, 0);
  tail.rotation.z = 0.3;
  group.add(tail);
  ellipsoid(tail, orange, [-0.4, 0, 0], [0.56, 0.2, 0.2]);
  ellipsoid(tail, white, [-0.83, 0, 0], [0.23, 0.145, 0.145]);
  group.userData.tail = tail;
  return finish(group, body, head);
}

export function buildDeer() {
  const group = new THREE.Group();
  const brown = coat(0xa9865d), cream = coat(0xe0c9a2), dark = coat(0x66513b);
  const body = ellipsoid(group, brown, [0, 1.12, 0], [0.97, 0.43, 0.36]);
  ellipsoid(group, cream, [-0.1, 0.91, 0], [0.69, 0.24, 0.29]);
  ellipsoid(group, brown, [-0.66, 1.15, 0], [0.38, 0.47, 0.37]);
  legs(group, brown, 0.63, 0.25, 0.97, 0.09, black);
  const neck = ellipsoid(group, brown, [0.78, 1.52, 0], [0.25, 0.63, 0.24]);
  neck.rotation.z = -0.34;
  const bib = ellipsoid(group, cream, [0.96, 1.46, 0], [0.12, 0.43, 0.17]);
  bib.rotation.z = -0.34;
  const head = new THREE.Group();
  head.position.set(1.02, 2.02, 0);
  group.add(head);
  ellipsoid(head, brown, [0.08, 0, 0], [0.33, 0.2, 0.19]);
  ellipsoid(head, dark, [0.34, -0.095, 0], [0.23, 0.115, 0.13]);
  ellipsoid(head, cream, [0.32, -0.16, 0], [0.2, 0.045, 0.12]);
  ellipsoid(head, black, [0.53, -0.08, 0], [0.065, 0.062, 0.1]);
  face(head, 0.16, 0.035, 0.172, 0.037);
  for (const side of [-1, 1]) {
    const ear = ellipsoid(head, brown, [-0.1, 0.18, side * 0.25], [0.12, 0.26, 0.065]);
    ear.rotation.x = side * 0.9;
    const inner = ellipsoid(head, cream, [-0.055, 0.19, side * 0.26], [0.065, 0.2, 0.039]);
    inner.rotation.x = side * 0.9;
    const points = [[-0.06, 0.13, side * 0.11], [-0.2, 0.43, side * 0.2], [-0.27, 0.7, side * 0.36], [-0.13, 0.96, side * 0.43]];
    for (let i = 0; i < points.length - 1; i++) {
      bone(head, ivory, points[i], points[i + 1], 0.045 - i * 0.009);
      if (i > 0) bone(head, ivory, points[i], [points[i][0] + 0.2, points[i][1] + 0.24, points[i][2]], 0.026, 0.005);
    }
  }
  const tail = ellipsoid(group, cream, [-0.99, 1.23, 0], [0.22, 0.1, 0.15]);
  tail.rotation.z = -0.4;
  return finish(group, body, head);
}

export function buildBear() {
  const group = new THREE.Group();
  const brown = coat(0x66513f), dark = coat(0x46382e), muzzle = coat(0xb69b75);
  const body = ellipsoid(group, brown, [-0.12, 1.01, 0], [1.18, 0.65, 0.58]);
  ellipsoid(group, dark, [0.63, 1.31, 0], [0.6, 0.66, 0.55]);
  legs(group, brown, 0.72, 0.38, 0.83, 0.21, dark);
  const head = new THREE.Group();
  head.position.set(1.04, 1.34, 0);
  group.add(head);
  ellipsoid(head, brown, [0.1, 0, 0], [0.43, 0.38, 0.35]);
  ellipsoid(head, muzzle, [0.43, -0.09, 0], [0.3, 0.18, 0.22]);
  ellipsoid(head, black, [0.67, -0.06, 0], [0.1, 0.08, 0.14]);
  face(head, 0.28, 0.09, 0.275, 0.039);
  for (const side of [-1, 1]) {
    ellipsoid(head, brown, [-0.07, 0.32, side * 0.26], [0.135, 0.15, 0.1]);
    ellipsoid(head, dark, [0, 0.33, side * 0.275], [0.075, 0.09, 0.066]);
  }
  for (const leg of group.userData.legs) {
    for (let claw = 0; claw < 3; claw++) {
      ellipsoid(leg, ivory, [0.24, -0.78, (claw - 1) * 0.09], [0.07, 0.025, 0.022]);
    }
  }
  return finish(group, body, head);
}

export function animateAnimal(animal, delta) {
  const rig = animal.group.userData;
  animal.gaitTime = (animal.gaitTime || 0) + delta * (animal.moving ? animal.speed * 4 : 1);
  const t = animal.gaitTime;
  const amplitude = animal.moving ? (animal.scaredFor > 0 ? 0.55 : 0.32) : 0;
  rig.legs.forEach((leg, index) => {
    const target = Math.sin(t + (index === 0 || index === 3 ? 0 : Math.PI)) * amplitude;
    leg.rotation.z = THREE.MathUtils.damp(leg.rotation.z, target, 12, delta);
  });
  rig.body.position.y = rig.bodyHeight + Math.sin(t * (animal.moving ? 2 : 1)) * (animal.moving ? 0.018 : 0.008);
  rig.head.rotation.z = rig.headRest + Math.sin(t * 0.6) * (animal.moving ? 0.025 : 0.08);
  if (rig.tail) rig.tail.rotation.y = Math.sin(t * 0.8) * 0.12;
}
