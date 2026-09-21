import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function part(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

export function box(parent, material, size, position, radius = 0.03) {
  return part(parent, new RoundedBoxGeometry(...size, 2, radius), material, position);
}

export function strut(parent, material, from, to, radius = 0.035) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const mesh = part(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
  mesh.position.copy(start.add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function hullGeometry(sections, segments = 24) {
  const positions = [], uvs = [], indices = [];
  sections.forEach(([z, width, height, centerY = 0], row) => {
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      positions.push(Math.cos(angle) * width, Math.sin(angle) * height + centerY, z);
      uvs.push(i / segments, row / (sections.length - 1));
      if (row === 0 || i === segments) continue;
      const a = (row - 1) * (segments + 1) + i, b = row * (segments + 1) + i;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  });
  for (const row of [0, sections.length - 1]) {
    const [z, , , centerY = 0] = sections[row];
    const center = positions.length / 3;
    positions.push(0, centerY, z);
    uvs.push(0.5, row === 0 ? 0 : 1);
    for (let i = 0; i < segments; i++) {
      const a = row * (segments + 1) + i;
      if (row === 0) indices.push(center, a + 1, a);
      else indices.push(center, a, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function plateGeometry(outline, thickness = 0.12) {
  const shape = new THREE.Shape();
  outline.forEach(([x, z], i) => i ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: true, bevelSegments: 1,
    steps: 1, bevelSize: 0.025, bevelThickness: 0.025,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, thickness / 2, 0);
  return geometry;
}

export function finGeometry(outline, thickness = 0.08) {
  const shape = new THREE.Shape();
  outline.forEach(([z, y], i) => i ? shape.lineTo(z, y) : shape.moveTo(z, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02,
    bevelSegments: 1, steps: 1,
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(thickness / 2, 0, 0);
  return geometry;
}

export function panelLines(parent, material, paths) {
  const points = [];
  paths.forEach((path) => {
    for (let i = 1; i < path.length; i++) points.push(...path[i - 1], ...path[i]);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  parent.add(new THREE.LineSegments(geometry, material));
}

export function bakeStructure(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  const lines = [];
  group.traverse((mesh) => {
    if (mesh.isLineSegments) { lines.push(mesh); return; }
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    geometry.clearGroups();
    if (!batches.has(mesh.material)) batches.set(mesh.material, []);
    batches.get(mesh.material).push(geometry);
    mesh.geometry.dispose();
  });
  group.clear();
  batches.forEach((geometries, material) => {
    const merged = mergeGeometries(geometries);
    const mesh = part(group, merged, material);
    mesh.name = material.name;
    geometries.forEach((geometry) => geometry.dispose());
  });
  lines.forEach((line) => group.add(line));
  return group;
}
