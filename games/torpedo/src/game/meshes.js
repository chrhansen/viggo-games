import * as THREE from 'three';
import { surfaceTexture } from './surfaceTextures.js';

let submarineTemplate;
const torpedoTemplates = new Map();

function addMesh(group, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function turnedHull(profile, material) {
  const geometry = new THREE.LatheGeometry(profile.map(([x, radius]) => new THREE.Vector2(radius, x)), 40);
  geometry.rotateZ(-Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function ring(group, x, radius, thickness, material) {
  const mesh = addMesh(group, new THREE.TorusGeometry(radius, thickness, 6, 40), material, [x, 0, 0]);
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function finGeometry(length, span, thickness) {
  const shape = new THREE.Shape();
  shape.moveTo(-length / 2, 0);
  shape.lineTo(length / 2, 0);
  shape.lineTo(length * 0.12, span);
  shape.lineTo(-length * 0.45, span * 0.94);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

function propeller(radius, material) {
  const group = new THREE.Group();
  const hub = addMesh(group, new THREE.SphereGeometry(radius * 0.23, 12, 8), material);
  hub.scale.x = 1.8;
  const bladeGeometry = finGeometry(radius * 0.46, radius, radius * 0.07);
  for (let i = 0; i < 7; i += 1) {
    const blade = addMesh(group, bladeGeometry, material);
    blade.rotation.set(i * Math.PI * 2 / 7, 0.38, -0.2);
  }
  group.name = 'propeller';
  return group;
}

function buildSubmarine() {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: '#526166', map: surfaceTexture('steel'), bumpMap: surfaceTexture('steel'),
    bumpScale: 0.025, roughness: 0.72, metalness: 0.48
  });
  const dark = new THREE.MeshStandardMaterial({ color: '#17262b', roughness: 0.83, metalness: 0.25 });
  const trim = new THREE.MeshStandardMaterial({ color: '#697778', roughness: 0.54, metalness: 0.65 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#85754e', roughness: 0.48, metalness: 0.72 });

  group.add(turnedHull([
    [-4.9, 0], [-4.7, 0.15], [-4.3, 0.28], [-3.8, 0.48], [-3.1, 0.64],
    [-2.4, 0.7], [2.9, 0.7], [3.65, 0.67], [4.25, 0.54], [4.7, 0.3], [4.9, 0]
  ], steel));
  const sonar = addMesh(group, new THREE.SphereGeometry(1, 28, 16), dark, [4.05, 0, 0]);
  sonar.scale.set(0.86, 0.57, 0.57);

  const deck = addMesh(group, new THREE.CapsuleGeometry(0.24, 4.7, 8, 16), steel, [-0.3, 0.61, 0]);
  deck.rotation.z = Math.PI / 2;
  deck.scale.x = 0.42;

  const sailShape = new THREE.Shape();
  sailShape.moveTo(-1.6, 0.55);
  sailShape.lineTo(-1.4, 1.45);
  sailShape.quadraticCurveTo(-1.3, 1.67, -0.95, 1.67);
  sailShape.lineTo(-0.05, 1.67);
  sailShape.quadraticCurveTo(0.38, 1.6, 0.48, 0.6);
  sailShape.closePath();
  const sailGeometry = new THREE.ExtrudeGeometry(sailShape, {
    depth: 0.38, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.09, bevelThickness: 0.09
  });
  sailGeometry.translate(0, 0, -0.19);
  addMesh(group, sailGeometry, steel);

  for (const [x, z, height] of [[-1.05, -0.08, 0.78], [-0.65, 0.08, 0.58], [-0.22, 0, 0.42]]) {
    addMesh(group, new THREE.CylinderGeometry(0.027, 0.045, height, 10), trim, [x, 1.62 + height / 2, z]);
    addMesh(group, new THREE.BoxGeometry(0.13, 0.07, 0.075), dark, [x + 0.035, 1.62 + height, z]);
  }

  for (const x of [-2.8, -1.9, 1.1, 2.1, 3.1]) {
    const hatch = addMesh(group, new THREE.CylinderGeometry(0.17, 0.18, 0.035, 20), dark, [x, 0.72, 0]);
    addMesh(group, new THREE.BoxGeometry(0.16, 0.025, 0.025), trim, [x, hatch.position.y + 0.03, 0]);
  }
  for (const x of [-2.3, -1.1, 0.1, 1.3, 2.5]) ring(group, x, 0.701, 0.004, dark);

  const ventGeometry = new THREE.BoxGeometry(0.075, 0.14, 0.018);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i += 1) {
      addMesh(group, ventGeometry, dark, [-2.6 + i * 0.15, 0.22, side * 0.665]);
    }
    for (const y of [-0.19, 0.19]) {
      const door = addMesh(group, new THREE.SphereGeometry(1, 14, 10), dark, [4.22, y, side * 0.405]);
      door.scale.set(0.28, 0.09, 0.04);
      door.rotation.y = side * 0.48;
    }
    const bowPlane = addMesh(group, finGeometry(0.95, 0.8, 0.06), steel, [2.5, 0, side * 0.55]);
    bowPlane.rotation.x = side * Math.PI / 2;
  }
  const sternFin = finGeometry(1.05, 0.68, 0.07);
  for (let i = 0; i < 4; i += 1) {
    const fin = addMesh(group, sternFin, steel, [-3.95, 0, 0]);
    fin.rotation.x = i * Math.PI / 2;
  }
  const screw = propeller(0.51, bronze);
  screw.position.x = -4.85;
  group.add(screw);
  return group;
}

export function createEnemySubmarineMesh() {
  submarineTemplate ??= buildSubmarine();
  const group = submarineTemplate.clone(true);
  group.userData.propeller = group.getObjectByName('propeller');
  return group;
}

export function createTorpedoMesh(color, glow) {
  const key = `${color}:${glow}`;
  if (!torpedoTemplates.has(key)) {
    const group = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({
      color: '#a0aaa8', map: surfaceTexture('steel'), bumpMap: surfaceTexture('steel'),
      bumpScale: 0.008, roughness: 0.46, metalness: 0.7
    });
    const dark = new THREE.MeshStandardMaterial({ color: '#26363b', roughness: 0.6, metalness: 0.5 });
    const marking = new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: 0.12, roughness: 0.62 });
    group.add(turnedHull([
      [-1.18, 0], [-1.05, 0.09], [-0.8, 0.16], [0.7, 0.18], [0.95, 0.16], [1.12, 0.1], [1.19, 0]
    ], steel));
    const nose = addMesh(group, new THREE.SphereGeometry(1, 20, 12), dark, [0.94, 0, 0]);
    nose.scale.set(0.26, 0.151, 0.151);
    ring(group, 0.65, 0.18, 0.027, marking);
    ring(group, -0.58, 0.168, 0.016, marking);
    const fins = finGeometry(0.4, 0.3, 0.025);
    for (let i = 0; i < 4; i += 1) {
      const fin = addMesh(group, fins, dark, [-0.85, 0, 0]);
      fin.rotation.x = i * Math.PI / 2;
    }
    const screw = propeller(0.16, steel);
    screw.position.x = -1.2;
    group.add(screw);
    torpedoTemplates.set(key, group);
  }
  const group = torpedoTemplates.get(key).clone(true);
  group.userData.propeller = group.getObjectByName('propeller');
  return group;
}

export function quaternionFacing(direction) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize());
  return quaternion;
}
