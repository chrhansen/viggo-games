import { CatmullRomCurve3, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GROUND_LEVEL } from './track';
import type { Obstacle, Point2 } from './collisions';

const rockMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
const hash = (n: number) => ((Math.sin(n * 91.31) * 43758.5453123) % 1 + 1) % 1;

export function createMountainGeometry(radius: number, height: number, seed: number, snowy = true) {
  const geometry = new CylinderGeometry(0.3, radius, height, 24, 14, false);
  const position = geometry.getAttribute('position');
  const colors: number[] = [];
  const moss = new Color('#4b663d'), meadow = new Color('#71815a');
  const stone = new Color('#777a78'), shadow = new Color('#505a5d'), snow = new Color('#eff3ee');
  const color = new Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const level = (position.getY(i) + height / 2) / height;
    const ridge = Math.sin(angle * 5 + seed) * 0.11 + Math.cos(angle * 9 - seed) * 0.055;
    const strata = Math.sin(level * 21 + angle * 3 + seed) * 0.04 * Math.sin(level * Math.PI);
    const spread = 1 + ridge * (1 - level * 0.4) + strata;
    position.setXYZ(i, x * spread, level * height, z * spread);
    const vegetationLine = 0.27 + Math.sin(angle * 3 + seed) * 0.055;
    const snowLine = 0.68 + Math.sin(angle * 5 + seed) * 0.065 + Math.cos(angle * 8) * 0.025;
    color.copy(stone).lerp(shadow, (Math.sin(angle * 8 + level * 12 + seed) + 1) * 0.22);
    if (level < vegetationLine) color.copy(moss).lerp(meadow, (Math.sin(angle * 4 + seed) + 1) * 0.4);
    else if (level < vegetationLine + 0.12) color.lerp(meadow, (vegetationLine + 0.12 - level) / 0.12);
    if (snowy && level > snowLine) color.lerp(snow, Math.min(1, (level - snowLine) / 0.055));
    color.multiplyScalar(0.91 + (Math.cos(angle * 7 + level * 15 + seed) + 1) * 0.045);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function baseOutline(mesh: Mesh): Point2[] {
  const position = mesh.geometry.getAttribute('position');
  let lowest = Infinity;
  for (let i = 0; i < position.count; i++) lowest = Math.min(lowest, position.getY(i));
  const points: Point2[] = [];
  const point = new Vector3();
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getY(i) - lowest) > 0.001) continue;
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    if (Math.hypot(point.x - mesh.parent!.position.x, point.z - mesh.parent!.position.z) < 1) continue;
    if (!points.some((p) => Math.hypot(p.x - point.x, p.z - point.z) < 0.001)) points.push({ x: point.x, z: point.z });
  }
  const center = mesh.parent!.position;
  return points.sort((a, b) => Math.atan2(a.z - center.z, a.x - center.x) - Math.atan2(b.z - center.z, b.x - center.x));
}

export function createMountains(curve: CatmullRomCurve3) {
  const group = new Group();
  const colliders: Obstacle[] = [];
  const road = curve.getSpacedPoints(1024);
  function addMountain(seed: number, angle: number, distance: number, scale = 1) {
    const mountain = new Group();
    const radius = (42 + hash(seed * 5.1) * 36) * scale;
    const height = (82 + hash(seed * 2.6) * 92) * scale;
    const peak = new Mesh(createMountainGeometry(radius, height, seed), rockMaterial);
    const foothill = new Mesh(createMountainGeometry(radius * 1.32, height * 0.35, seed + 19, false), rockMaterial);
    foothill.position.y = -0.25;
    mountain.add(foothill, peak);
    mountain.rotation.y = hash(seed * 6.8) * Math.PI;
    // Reserve the full irregular base plus the road shoulder before placing a peak.
    const clearance = radius * 1.32 * 1.17 + 12;
    do {
      mountain.position.set(Math.cos(angle) * distance, GROUND_LEVEL, Math.sin(angle) * distance);
      distance += 12;
    } while (road.some((point) => Math.hypot(point.x - mountain.position.x, point.z - mountain.position.z) < clearance));
    group.add(mountain);
    group.updateMatrixWorld(true);
    for (const mesh of [foothill, peak]) colliders.push({ kind: 'polygon', points: baseOutline(mesh) });
  }
  for (let i = 0; i < 22; i++) {
    const angle = i / 22 * Math.PI * 2;
    const radius = 275 + hash(i * 7.4) * 95;
    addMountain(i, angle, radius);
    if (hash(i * 2.1) > 0.44) addMountain(i + 40, angle + 0.06, radius - 18, 0.68);
  }
  return { group, colliders };
}
