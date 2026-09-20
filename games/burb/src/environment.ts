import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { GROUND_LEVEL } from './track';
import { createBarkTexture, detailedPineGeometry } from './tree-detail';
import type { Obstacle } from './collisions';

const ROAD_WIDTH = 14;
const ROAD_HALF_WIDTH = ROAD_WIDTH * 0.5;
const FOLIAGE_ROAD_SAMPLE_COUNT = 2048;
const FOLIAGE_OFFSET_STEP = 4;
const FOLIAGE_OFFSET_ATTEMPTS = 8;
const FOLIAGE_ROADSIDE_MARGIN = 2.5;
const MAX_SHRUB_REACH = 3.5;
const UP = new Vector3(0, 1, 0);

export function createScenery(curvePath: CatmullRomCurve3) {
  const group = new Group();
  const colliders: Obstacle[] = [];
  const bark = createBarkTexture();
  const roadSamplePoints = sampleRoadPoints(curvePath, FOLIAGE_ROAD_SAMPLE_COUNT);
  const trunkMaterial = new MeshStandardMaterial({
    color: '#6d4728',
    map: bark,
    bumpMap: bark,
    bumpScale: 0.035,
    roughness: 1,
    flatShading: true,
  });
  const barkMaterial = new MeshStandardMaterial({
    color: '#84552f',
    map: bark,
    roughness: 1,
    flatShading: true,
  });
  const pineDarkMaterial = new MeshStandardMaterial({
    color: '#2a6030',
    vertexColors: true,
    roughness: 1,
    flatShading: true,
  });
  const pineLightMaterial = new MeshStandardMaterial({
    color: '#3f8644',
    vertexColors: true,
    roughness: 1,
    flatShading: true,
  });
  const broadleafDarkMaterial = new MeshStandardMaterial({
    color: '#407239',
    roughness: 1,
    flatShading: true,
  });
  const broadleafLightMaterial = new MeshStandardMaterial({
    color: '#5c9653',
    roughness: 1,
    flatShading: true,
  });
  const shrubMaterial = new MeshStandardMaterial({
    color: '#517b40',
    roughness: 1,
    flatShading: true,
  });
  const trunkGeometry = new CylinderGeometry(0.1, 0.34, 2.8, 9, 3);
  const branchGeometry = new CylinderGeometry(0.03, 0.06, 1.05, 5);
  const pineLargeGeometry = detailedPineGeometry(1.7, 2.9);
  const pineMediumGeometry = detailedPineGeometry(1.35, 2.45);
  const pineSmallGeometry = detailedPineGeometry(1.05, 2);
  const leafBlobGeometry = new IcosahedronGeometry(1.15, 1);
  const shrubGeometry = new IcosahedronGeometry(0.55, 0);
  const postGeometry = new BoxGeometry(0.12, 0.9, 0.12);
  const postMaterial = new MeshStandardMaterial({ color: '#f4f0e7', roughness: 0.95 });
  const reflectorGeometry = new BoxGeometry(0.08, 0.14, 0.04);
  const reflectorMaterial = new MeshStandardMaterial({ color: '#cf4736', emissive: '#52201a' });

  for (let index = 0; index < 148; index += 1) {
    const t = (index / 148 + hash(index * 0.19) * 0.015) % 1;
    const point = curvePath.getPointAt(t);
    const tangent = curvePath.getTangentAt(t).normalize();
    const right = new Vector3().crossVectors(UP, tangent).normalize();
    const side = hash(index * 1.7) > 0.5 ? 1 : -1;
    const offset = ROAD_WIDTH * 0.72 + 5.5 + hash(index * 3.3) * 19;
    const scale = 0.85 + hash(index * 4.9) * 1.35;
    const broadleafTree = hash(index * 2.4) > 0.48;
    const treeFootprintRadius = (broadleafTree ? 2.1 : 1.85) * scale + 0.35;
    const treeClearance = ROAD_HALF_WIDTH + Math.max(treeFootprintRadius, MAX_SHRUB_REACH) + FOLIAGE_ROADSIDE_MARGIN;
    const treePosition = findClearRoadsidePosition(
      point,
      right,
      side,
      offset,
      treeClearance,
      roadSamplePoints,
    );

    if (!treePosition) {
      continue;
    }

    const tree =
      broadleafTree
        ? createBroadleafTree(
            scale,
            trunkGeometry,
            branchGeometry,
            leafBlobGeometry,
            trunkMaterial,
            barkMaterial,
            broadleafDarkMaterial,
            broadleafLightMaterial,
          )
        : createPineTree(
            scale,
            trunkGeometry,
            pineLargeGeometry,
            pineMediumGeometry,
            pineSmallGeometry,
            trunkMaterial,
            pineDarkMaterial,
            pineLightMaterial,
          );

    tree.position.copy(treePosition);
    tree.position.y = GROUND_LEVEL;
    tree.rotation.y = hash(index * 9.2) * Math.PI * 2;
    tree.rotation.z = (hash(index * 6.8) - 0.5) * 0.06 * side;
    group.add(tree);
    colliders.push({ kind: 'circle', center: { x: tree.position.x, z: tree.position.z }, radius: 0.34 * scale });

    const shrubCount = hash(index * 8.6) > 0.42 ? 2 : 1;
    for (let shrubIndex = 0; shrubIndex < shrubCount; shrubIndex += 1) {
      const shrubScale = 0.7 + hash(index * 5.4 + shrubIndex) * 0.7;
      const shrub = createShrub(shrubScale, shrubGeometry, shrubMaterial);
      const localAngle = hash(index * 7.2 + shrubIndex) * Math.PI * 2;
      const localRadius = 1.1 + hash(index * 4.2 + shrubIndex * 2.1) * 1.35;

      shrub.position.copy(tree.position);
      shrub.position.x += Math.cos(localAngle) * localRadius;
      shrub.position.z += Math.sin(localAngle) * localRadius;

      const shrubClearance = ROAD_HALF_WIDTH + shrubScale * 0.75 + FOLIAGE_ROADSIDE_MARGIN;

      if (!hasRoadClearance(shrub.position, shrubClearance, roadSamplePoints)) {
        continue;
      }

      shrub.position.y = GROUND_LEVEL + 0.22;
      shrub.rotation.y = hash(index * 1.3 + shrubIndex) * Math.PI * 2;
      group.add(shrub);
    }
  }

  for (let index = 0; index < 64; index += 1) {
    const point = curvePath.getPointAt(index / 64);
    const tangent = curvePath.getTangentAt(index / 64).normalize();
    const right = new Vector3().crossVectors(UP, tangent).normalize();

    for (const side of [-1, 1]) {
      const post = new Mesh(postGeometry, postMaterial);
      const reflector = new Mesh(reflectorGeometry, reflectorMaterial);

      post.position.copy(point).addScaledVector(right, side * (ROAD_WIDTH * 0.58 + 0.85));
      post.position.y = GROUND_LEVEL + 0.45;
      reflector.position.set(post.position.x, GROUND_LEVEL + 0.58, post.position.z + side * 0.02);
      group.add(post, reflector);
    }
  }

  group.add(createSpeedSign(curvePath));

  return { group, colliders };
}

function createPineTree(
  scale: number,
  trunkGeometry: CylinderGeometry,
  pineLargeGeometry: ConeGeometry,
  pineMediumGeometry: ConeGeometry,
  pineSmallGeometry: ConeGeometry,
  trunkMaterial: MeshStandardMaterial,
  pineDarkMaterial: MeshStandardMaterial,
  pineLightMaterial: MeshStandardMaterial,
) {
  const tree = new Group();
  const trunk = new Mesh(trunkGeometry, trunkMaterial);
  const baseCanopy = new Mesh(pineLargeGeometry, pineDarkMaterial);
  const midCanopy = new Mesh(pineMediumGeometry, pineLightMaterial);
  const topCanopy = new Mesh(pineSmallGeometry, pineDarkMaterial);

  trunk.position.y = 1.25 * scale;
  trunk.scale.set(0.75 * scale, scale, 0.75 * scale);

  baseCanopy.position.y = 2.55 * scale;
  baseCanopy.scale.setScalar(1.02 * scale);
  midCanopy.position.y = 3.65 * scale;
  midCanopy.scale.setScalar(0.88 * scale);
  midCanopy.rotation.y = 0.7;
  topCanopy.position.y = 4.55 * scale;
  topCanopy.scale.setScalar(0.68 * scale);
  topCanopy.rotation.y = 1.5;

  tree.add(trunk, baseCanopy, midCanopy, topCanopy);
  return tree;
}

function createBroadleafTree(
  scale: number,
  trunkGeometry: CylinderGeometry,
  branchGeometry: CylinderGeometry,
  leafBlobGeometry: IcosahedronGeometry,
  trunkMaterial: MeshStandardMaterial,
  barkMaterial: MeshStandardMaterial,
  broadleafDarkMaterial: MeshStandardMaterial,
  broadleafLightMaterial: MeshStandardMaterial,
) {
  const tree = new Group();
  const trunk = new Mesh(trunkGeometry, trunkMaterial);
  const branchLeft = new Mesh(branchGeometry, barkMaterial);
  const branchRight = new Mesh(branchGeometry, barkMaterial);
  const crownCore = new Mesh(leafBlobGeometry, broadleafDarkMaterial);
  const crownLeft = new Mesh(leafBlobGeometry, broadleafLightMaterial);
  const crownRight = new Mesh(leafBlobGeometry, broadleafLightMaterial);
  const crownTop = new Mesh(leafBlobGeometry, broadleafDarkMaterial);

  trunk.position.y = 1.45 * scale;
  trunk.scale.set(0.82 * scale, 1.22 * scale, 0.82 * scale);

  branchLeft.position.set(-0.3 * scale, 2.65 * scale, 0);
  branchLeft.rotation.z = 1;
  branchLeft.scale.setScalar(0.72 * scale);

  branchRight.position.set(0.3 * scale, 2.6 * scale, 0.05 * scale);
  branchRight.rotation.z = -0.92;
  branchRight.scale.setScalar(0.76 * scale);

  crownCore.position.set(0, 3.8 * scale, 0);
  crownCore.scale.setScalar(1.28 * scale);
  crownLeft.position.set(-0.8 * scale, 3.65 * scale, 0.24 * scale);
  crownLeft.scale.setScalar(0.92 * scale);
  crownRight.position.set(0.86 * scale, 3.55 * scale, -0.18 * scale);
  crownRight.scale.setScalar(0.98 * scale);
  crownTop.position.set(0.1 * scale, 4.62 * scale, 0.12 * scale);
  crownTop.scale.setScalar(0.82 * scale);

  tree.add(trunk, branchLeft, branchRight, crownCore, crownLeft, crownRight, crownTop);
  return tree;
}

function createShrub(scale: number, shrubGeometry: IcosahedronGeometry, shrubMaterial: MeshStandardMaterial) {
  const shrub = new Group();
  const left = new Mesh(shrubGeometry, shrubMaterial);
  const right = new Mesh(shrubGeometry, shrubMaterial);
  const top = new Mesh(shrubGeometry, shrubMaterial);

  left.position.set(-0.22 * scale, 0.22 * scale, 0);
  left.scale.setScalar(0.72 * scale);
  right.position.set(0.24 * scale, 0.2 * scale, 0.08 * scale);
  right.scale.setScalar(0.76 * scale);
  top.position.set(0, 0.42 * scale, 0);
  top.scale.setScalar(0.62 * scale);

  shrub.add(left, right, top);
  return shrub;
}

function sampleRoadPoints(curvePath: CatmullRomCurve3, sampleCount: number) {
  return Array.from({ length: sampleCount + 1 }, (_, index) => curvePath.getPointAt(index / sampleCount));
}

function findClearRoadsidePosition(
  point: Vector3,
  right: Vector3,
  side: number,
  startingOffset: number,
  roadClearance: number,
  roadSamplePoints: Vector3[],
) {
  const candidate = new Vector3();

  for (let attempt = 0; attempt < FOLIAGE_OFFSET_ATTEMPTS; attempt += 1) {
    candidate.copy(point).addScaledVector(right, side * (startingOffset + attempt * FOLIAGE_OFFSET_STEP));

    if (hasRoadClearance(candidate, roadClearance, roadSamplePoints)) {
      return candidate.clone();
    }
  }

  return null;
}

function hasRoadClearance(position: Vector3, roadClearance: number, roadSamplePoints: Vector3[]) {
  return getRoadDistanceSquared(position, roadSamplePoints) >= roadClearance * roadClearance;
}

function getRoadDistanceSquared(position: Vector3, roadSamplePoints: Vector3[]) {
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  for (let index = 0; index < roadSamplePoints.length - 1; index += 1) {
    const start = roadSamplePoints[index];
    const end = roadSamplePoints[index + 1];
    const segmentX = end.x - start.x;
    const segmentZ = end.z - start.z;
    const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    const fromStartX = position.x - start.x;
    const fromStartZ = position.z - start.z;
    const projection =
      segmentLengthSquared === 0
        ? 0
        : MathUtils.clamp((fromStartX * segmentX + fromStartZ * segmentZ) / segmentLengthSquared, 0, 1);
    const dx = fromStartX - segmentX * projection;
    const dz = fromStartZ - segmentZ * projection;
    const distanceSquared = dx * dx + dz * dz;

    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
    }
  }

  return nearestDistanceSquared;
}

function createSpeedSign(curvePath: CatmullRomCurve3) {
  const t = 0.08;
  const side = 1;
  const point = curvePath.getPointAt(t);
  const tangent = curvePath.getTangentAt(t).normalize();
  const right = new Vector3().crossVectors(UP, tangent).normalize();
  const signForward = right.clone().multiplyScalar(-side);
  const group = new Group();

  const postMaterial = new MeshStandardMaterial({
    color: '#6e4a2e',
    roughness: 0.94,
    flatShading: true,
  });
  const frameMaterial = new MeshStandardMaterial({
    color: '#cfd5dc',
    roughness: 0.82,
    metalness: 0.08,
  });
  const faceMaterial = new MeshStandardMaterial({
    map: createSpeedSignTexture(),
    roughness: 0.9,
    metalness: 0.02,
    side: DoubleSide,
  });

  const leftPost = new Mesh(new BoxGeometry(0.18, 4.2, 0.18), postMaterial);
  const rightPost = new Mesh(new BoxGeometry(0.18, 4.2, 0.18), postMaterial);
  const frame = new Mesh(new BoxGeometry(6.3, 4.1, 0.24), frameMaterial);
  const face = new Mesh(new PlaneGeometry(5.8, 3.6), faceMaterial);

  leftPost.position.set(-2.15, 2.1, 0);
  rightPost.position.set(2.15, 2.1, 0);
  frame.position.set(0, 4.65, -0.03);
  face.position.set(0, 4.65, 0.1);

  group.add(leftPost, rightPost, frame, face);
  group.position.copy(point).addScaledVector(right, side * (ROAD_WIDTH * 0.5 + 7.5));
  group.position.y = GROUND_LEVEL;
  group.rotation.y = Math.atan2(signForward.x, signForward.z);

  return group;
}

function createSpeedSignTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 1024;
  canvasTexture.height = 640;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for speed sign texture.');
  }

  context.fillStyle = '#f7f2d7';
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  context.strokeStyle = '#232629';
  context.lineWidth = 26;
  context.strokeRect(34, 34, canvasTexture.width - 68, canvasTexture.height - 68);

  context.fillStyle = '#232629';
  context.font = 'bold 210px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('67 mph', canvasTexture.width * 0.5, 255);

  context.font = 'bold 94px sans-serif';
  context.fillText('haha', canvasTexture.width * 0.5, 465);

  const texture = new CanvasTexture(canvasTexture);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
function hash(value: number) {
  return MathUtils.euclideanModulo(Math.sin(value * 91.31) * 43758.5453123, 1);
}
