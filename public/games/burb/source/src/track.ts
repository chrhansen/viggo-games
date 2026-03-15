import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';

export const GROUND_LEVEL = 0;
export const SHOULDER_SURFACE_LIFT = 0.006;
export const ROAD_SURFACE_LIFT = 0.012;

const ROAD_WIDTH = 14;
const SHOULDER_WIDTH = ROAD_WIDTH + 6.5;
const UP = new Vector3(0, 1, 0);

export function createRoad(curvePath: CatmullRomCurve3, anisotropy: number) {
  const group = new Group();
  const shoulderGeometry = createRoadGeometry(
    curvePath,
    520,
    SHOULDER_WIDTH,
    SHOULDER_SURFACE_LIFT,
  );
  const shoulderTexture = createShoulderTexture();
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
  const roadTexture = createRoadTexture();
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

export function createGround(anisotropy: number) {
  const groundTexture = createGrassTexture();
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

function createRoadTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 512;
  canvasTexture.height = 2048;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for road texture.');
  }

  context.fillStyle = '#171b20';
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  const image = context.getImageData(0, 0, canvasTexture.width, canvasTexture.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = 18 + Math.random() * 20;
    const warmShift = Math.random() * 3;
    image.data[index] = grain + warmShift;
    image.data[index + 1] = grain + warmShift;
    image.data[index + 2] = grain + 6 + Math.random() * 10;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  context.fillStyle = 'rgba(255, 255, 255, 1)';
  context.fillRect(22, 0, 14, canvasTexture.height);
  context.fillRect(canvasTexture.width - 36, 0, 14, canvasTexture.height);

  context.fillStyle = '#ffd94d';
  for (let y = 0; y < canvasTexture.height; y += 190) {
    context.fillRect(canvasTexture.width * 0.5 - 14, y + 20, 28, 132);
  }

  context.fillStyle = 'rgba(255, 255, 255, 0.08)';
  context.fillRect(50, 0, 26, canvasTexture.height);
  context.fillRect(canvasTexture.width - 76, 0, 26, canvasTexture.height);

  context.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  context.lineWidth = 6;
  for (let crack = 0; crack < 28; crack += 1) {
    const x = 70 + Math.random() * (canvasTexture.width - 140);
    const y = Math.random() * canvasTexture.height;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.random() * 30 - 15, y + 70);
    context.stroke();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createShoulderTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 512;
  canvasTexture.height = 2048;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for shoulder texture.');
  }

  context.fillStyle = '#a1957e';
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  const image = context.getImageData(0, 0, canvasTexture.width, canvasTexture.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = 126 + Math.random() * 36;
    image.data[index] = grain + Math.random() * 16;
    image.data[index + 1] = grain - 14 + Math.random() * 12;
    image.data[index + 2] = grain - 34 + Math.random() * 12;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.fillRect(84, 0, 14, canvasTexture.height);
  context.fillRect(canvasTexture.width - 98, 0, 14, canvasTexture.height);

  context.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let patch = 0; patch < 180; patch += 1) {
    context.beginPath();
    context.ellipse(
      Math.random() * canvasTexture.width,
      Math.random() * canvasTexture.height,
      8 + Math.random() * 22,
      5 + Math.random() * 14,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createGrassTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 384;
  canvasTexture.height = 384;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for grass texture.');
  }

  context.fillStyle = '#6f9b49';
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  const image = context.getImageData(0, 0, canvasTexture.width, canvasTexture.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const green = 92 + Math.random() * 75;
    image.data[index] = 42 + Math.random() * 28;
    image.data[index + 1] = green;
    image.data[index + 2] = 28 + Math.random() * 16;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  for (let patch = 0; patch < 80; patch += 1) {
    context.fillStyle = `rgba(82, 112, 44, ${0.08 + Math.random() * 0.12})`;
    context.beginPath();
    context.ellipse(
      Math.random() * canvasTexture.width,
      Math.random() * canvasTexture.height,
      10 + Math.random() * 26,
      6 + Math.random() * 16,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
