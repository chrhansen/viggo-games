import * as THREE from "three";
import { vehicleMaterials } from "./vehicle-materials.js";
import { part, box, strut, bakeStructure } from "./vehicle-geometry.js";

let template;

function solarArray(structure, side) {
  const m = vehicleMaterials();
  const centerX = side * 3.65;
  strut(structure, m.steel, [side * 0.8, 0, -0.06], [side * 5.5, 0, -0.06], 0.065);
  part(structure, new THREE.CylinderGeometry(0.17, 0.17, 0.38, 16), m.steel,
    [side * 1.35, 0, 0], [0, 0, Math.PI / 2]);
  for (const y of [-1.14, 1.14]) box(structure, m.steel, [3.82, 0.06, 0.1], [centerX, y, 0], 0.01);
  for (const offset of [-1.88, 0, 1.88]) box(structure, m.steel, [0.06, 2.25, 0.1], [centerX + offset, 0, 0], 0.01);
  for (const offset of [-0.94, 0.94]) {
    part(structure, new THREE.PlaneGeometry(1.8, 2.18), m.panel, [centerX + offset, 0, 0.055]);
  }
  for (const y of [-0.57, 0.57]) box(structure, m.trim, [3.7, 0.025, 0.035], [centerX, y, 0.08], 0.004);
  strut(structure, m.steel, [side * 0.75, -0.7, -0.45], [side * 1.82, -0.9, -0.07], 0.04);
}

function antenna(structure) {
  const m = vehicleMaterials();
  const dish = new THREE.Group();
  dish.position.set(0, 1.48, 0.25);
  dish.rotation.x = 0.65;
  const profile = [];
  for (let i = 0; i <= 20; i++) {
    const radius = 0.96 * i / 20;
    profile.push(new THREE.Vector2(radius, 0.4 * (radius / 0.96) ** 2));
  }
  part(dish, new THREE.LatheGeometry(profile, 40), m.dish);
  part(dish, new THREE.TorusGeometry(0.96, 0.025, 8, 40), m.steel, [0, 0.4, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3;
    strut(dish, m.steel, [Math.cos(angle) * 0.83, 0.3, Math.sin(angle) * 0.83], [0, 0.83, 0], 0.022);
  }
  part(dish, new THREE.CylinderGeometry(0.09, 0.12, 0.2, 12), m.trim, [0, 0.82, 0]);
  strut(structure, m.steel, [0, 0.8, -0.1], [0, 1.65, 0.25], 0.13);
  structure.add(dish);
}

export function createSatellite() {
  if (!template) {
    const m = vehicleMaterials();
    const structure = new THREE.Group();
    box(structure, m.foil, [1.75, 1.82, 1.65], [0, 0, 0], 0.1);
    for (const side of [-1, 1]) {
      solarArray(structure, side);
      for (const z of [-0.85, 0.85]) {
        strut(structure, m.steel, [side * 0.86, -0.91, z], [side * 0.86, 0.91, z], 0.038);
      }
      box(structure, m.radiator, [1.32, 1.35, 0.045], [0, -0.08, side * 0.85], 0.01);
      for (let i = 0; i < 8; i++) {
        box(structure, m.steel, [1.22, 0.025, 0.02], [0, -0.61 + i * 0.15, side * 0.884], 0.003);
      }
      part(structure, new THREE.CylinderGeometry(0.09, 0.18, 0.26, 12, 1, true), m.nozzle,
        [side * 0.8, -0.87, 0.65], [Math.PI, 0, side * 0.4]);
    }
    antenna(structure);
    strut(structure, m.steel, [-0.62, 0.85, -0.6], [-0.72, 2.6, -0.7], 0.018);
    strut(structure, m.steel, [-0.95, 2.22, -0.7], [-0.49, 2.22, -0.7], 0.015);
    part(structure, new THREE.CylinderGeometry(0.26, 0.3, 0.35, 20), m.trim,
      [0.45, 0.46, 0.96], [Math.PI / 2, 0, 0]);
    part(structure, new THREE.CircleGeometry(0.2, 20), m.canopy, [0.45, 0.46, 1.14]);
    part(structure, new THREE.SphereGeometry(0.05, 8, 8), m.navRed, [-0.8, 0.94, 0.8]);
    template = bakeStructure(structure);
  }
  return template.clone(true);
}
