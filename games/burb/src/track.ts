import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';

import { createBurbTexture, type BurbTextureFactory } from './textures';

export const GROUND_LEVEL = 0;
export const SHOULDER_SURFACE_LIFT = 0.006;
export const ROAD_SURFACE_LIFT = 0.012;

const ROAD_WIDTH = 14;
const SHOULDER_WIDTH = ROAD_WIDTH + 6.5;
const UP = new Vector3(0, 1, 0);

export function createRoad(curvePath: CatmullRomCurve3, anisotropy: number, textures: BurbTextureFactory) {
  const group = new Group();
  const shoulderGeometry = createRoadGeometry(
    curvePath,
    520,
    SHOULDER_WIDTH,
    SHOULDER_SURFACE_LIFT,
  );
  const shoulderTexture = createBurbTexture('shoulder', textures);
  shoulderTexture.anisotropy = anisotropy;
  const shoulder = new Mesh(
    shoulderGeometry,
    new MeshStandardMaterial({
      map: shoulderTexture,
      color: '#8e866f',
      roughness: 1,
      metalness: 0,
    }),
  );
  const roadGeometry = createRoadGeometry(curvePath, 520, ROAD_WIDTH, ROAD_SURFACE_LIFT);
  const roadTexture = createBurbTexture('road', textures);
  roadTexture.anisotropy = anisotropy;
  const road = new Mesh(
    roadGeometry,
    new MeshStandardMaterial({
      map: roadTexture,
      color: '#171b20',
      roughness: 0.92,
      metalness: 0.02,
    }),
  );

  group.add(shoulder, road);
  return group;
}

export function createGround(anisotropy: number, textures: BurbTextureFactory) {
  const groundTexture = createBurbTexture('grass', textures);
  groundTexture.anisotropy = anisotropy;
  groundTexture.repeat.set(80, 80);

  const ground = new Mesh(
    new PlaneGeometry(1200, 1200),
    new MeshStandardMaterial({
      map: groundTexture,
      roughness: 1,
      metalness: 0,
      color: '#7aa653',
    }),
  );

  ground.rotation.x = -Math.PI * 0.5;
  ground.position.y = GROUND_LEVEL;
  return ground;
}

function createRoadGeometry(
  curvePath: CatmullRomCurve3,
  segments: number,
  width: number,
  surfaceLift: number,
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let distanceAlongRoad = 0;

  for (let step = 0; step <= segments; step += 1) {
    const t = step / segments;
    const point = curvePath.getPointAt(t);
    const tangent = curvePath.getTangentAt(t).normalize();
    const right = new Vector3().crossVectors(UP, tangent).normalize();

    if (step > 0) {
      const previousPoint = curvePath.getPointAt((step - 1) / segments);
      distanceAlongRoad += previousPoint.distanceTo(point);
    }

    const leftEdge = point.clone().addScaledVector(right, -width * 0.5);
    const rightEdge = point.clone().addScaledVector(right, width * 0.5);

    positions.push(leftEdge.x, leftEdge.y + surfaceLift, leftEdge.z);
    positions.push(rightEdge.x, rightEdge.y + surfaceLift, rightEdge.z);

    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, distanceAlongRoad / 22, 1, distanceAlongRoad / 22);

    if (step === segments) {
      continue;
    }

    const vertex = step * 2;
    indices.push(vertex, vertex + 2, vertex + 1);
    indices.push(vertex + 1, vertex + 2, vertex + 3);
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  return geometry;
}
