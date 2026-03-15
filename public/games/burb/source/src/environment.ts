import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { GROUND_LEVEL } from './track';

const ROAD_WIDTH = 14;
const UP = new Vector3(0, 1, 0);

export function createSky() {
  const group = new Group();
  const skyTexture = createSkyTexture();
  const cloudTexture = createCloudTexture();
  const dome = new Mesh(
    new SphereGeometry(720, 36, 24),
    new MeshBasicMaterial({
      map: skyTexture,
      side: BackSide,
      fog: false,
    }),
  );
  const cloudMaterial = new MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: false,
  });

  group.add(dome);

  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2 + hash(index * 2.7) * 0.2;
    const radius = 250 + hash(index * 4.1) * 150;
    const width = 48 + hash(index * 5.6) * 72;
    const height = width * (0.24 + hash(index * 6.2) * 0.16);
    const cloud = new Mesh(new PlaneGeometry(width, height), cloudMaterial);
    const cloudHeight = 110 + hash(index * 3.9) * 58;

    cloud.position.set(Math.cos(angle) * radius, cloudHeight, Math.sin(angle) * radius);
    cloud.lookAt(0, cloudHeight - 16, 0);
    cloud.rotateZ((hash(index * 7.4) - 0.5) * 0.6);
    group.add(cloud);
  }

  return group;
}

export function createScenery(curvePath: CatmullRomCurve3) {
  const group = new Group();
  const trunkMaterial = new MeshStandardMaterial({
    color: '#6d4728',
    roughness: 1,
    flatShading: true,
  });
  const barkMaterial = new MeshStandardMaterial({
    color: '#84552f',
    roughness: 1,
    flatShading: true,
  });
  const pineDarkMaterial = new MeshStandardMaterial({
    color: '#2a6030',
    roughness: 1,
    flatShading: true,
  });
  const pineLightMaterial = new MeshStandardMaterial({
    color: '#3f8644',
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
  const trunkGeometry = new CylinderGeometry(0.18, 0.28, 2.8, 7);
  const branchGeometry = new CylinderGeometry(0.03, 0.06, 1.05, 5);
  const pineLargeGeometry = new ConeGeometry(1.7, 2.9, 8);
  const pineMediumGeometry = new ConeGeometry(1.35, 2.45, 8);
  const pineSmallGeometry = new ConeGeometry(1.05, 2, 8);
  const leafBlobGeometry = new IcosahedronGeometry(1.15, 0);
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
    const tree =
      hash(index * 2.4) > 0.48
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

    tree.position.copy(point).addScaledVector(right, side * offset);
    tree.position.y = GROUND_LEVEL;
    tree.rotation.y = hash(index * 9.2) * Math.PI * 2;
    tree.rotation.z = (hash(index * 6.8) - 0.5) * 0.06 * side;
    group.add(tree);

    const shrubCount = hash(index * 8.6) > 0.42 ? 2 : 1;
    for (let shrubIndex = 0; shrubIndex < shrubCount; shrubIndex += 1) {
      const shrub = createShrub(0.7 + hash(index * 5.4 + shrubIndex) * 0.7, shrubGeometry, shrubMaterial);
      const localAngle = hash(index * 7.2 + shrubIndex) * Math.PI * 2;
      const localRadius = 1.1 + hash(index * 4.2 + shrubIndex * 2.1) * 1.35;

      shrub.position.copy(tree.position);
      shrub.position.x += Math.cos(localAngle) * localRadius;
      shrub.position.z += Math.sin(localAngle) * localRadius;
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

  return group;
}

export function createMountains() {
  const group = new Group();

  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * Math.PI * 2;
    const radius = 275 + hash(index * 7.4) * 95;
    const mountain = createMountain(index);

    mountain.position.set(Math.cos(angle) * radius, GROUND_LEVEL, Math.sin(angle) * radius);
    mountain.rotation.y = hash(index * 6.8) * Math.PI;
    group.add(mountain);

    if (hash(index * 2.1) > 0.44) {
      const shoulder = createMountain(index + 40, 0.68);
      shoulder.position.set(
        Math.cos(angle + 0.06) * (radius - 18),
        GROUND_LEVEL,
        Math.sin(angle + 0.06) * (radius - 18),
      );
      shoulder.rotation.y = hash(index * 5.2) * Math.PI;
      group.add(shoulder);
    }
  }

  return group;
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
  topCanopy.position.y = 4.55 * scale;
  topCanopy.scale.setScalar(0.68 * scale);

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

function createMountain(seed: number, scale = 1) {
  const group = new Group();
  const baseRadius = (42 + hash(seed * 5.1) * 36) * scale;
  const height = (82 + hash(seed * 2.6) * 92) * scale;
  const rockColor = new Color('#5f748f').lerp(new Color('#8aa0bb'), hash(seed * 4.2) * 0.38);
  const foothillColor = rockColor.clone().lerp(new Color('#54657a'), 0.35);
  const rockMaterial = new MeshStandardMaterial({
    color: rockColor,
    roughness: 1,
    flatShading: true,
  });
  const foothillMaterial = new MeshStandardMaterial({
    color: foothillColor,
    roughness: 1,
    flatShading: true,
  });
  const snowMaterial = new MeshStandardMaterial({
    color: '#eef3fb',
    roughness: 0.9,
    flatShading: true,
  });
  const foothill = new Mesh(createMountainGeometry(baseRadius * 1.32, height * 0.42, seed + 19), foothillMaterial);
  const peak = new Mesh(createMountainGeometry(baseRadius, height, seed), rockMaterial);

  foothill.position.y = -2;
  group.add(foothill, peak);

  if (height > 118 || hash(seed * 3.3) > 0.72) {
    const snowCap = new Mesh(
      createMountainGeometry(baseRadius * 0.28, height * 0.25, seed + 71),
      snowMaterial,
    );
    snowCap.position.y = height * 0.68;
    group.add(snowCap);
  }

  return group;
}

function createMountainGeometry(baseRadius: number, height: number, seed: number) {
  const geometry = new CylinderGeometry(0.6, baseRadius, height, 10, 5, false);
  const position = geometry.getAttribute('position');
  const ridgeCount = 3 + Math.floor(hash(seed * 1.9) * 4);
  const cragCount = 5 + Math.floor(hash(seed * 3.4) * 5);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const heightMix = (y + height * 0.5) / height;
    const ridgeWave = Math.sin(angle * ridgeCount + seed * 0.9) * 0.08;
    const cragWave = Math.cos(angle * cragCount - seed * 0.6) * 0.05;
    const noise = (hash(seed * 11.4 + index * 0.37) - 0.5) * 0.18;
    const spread = 1 + (ridgeWave + cragWave + noise) * (0.4 + (1 - heightMix) * 0.8);
    const uplift = Math.max(0, heightMix - 0.72) * (hash(seed * 2.8 + angle) - 0.5) * height * 0.22;

    position.setXYZ(index, x * spread, y + uplift, z * spread);
  }

  geometry.translate(0, height * 0.5, 0);
  geometry.computeVertexNormals();
  return geometry;
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

function createSkyTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 1024;
  canvasTexture.height = 512;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for sky texture.');
  }

  const skyGradient = context.createLinearGradient(0, 0, 0, canvasTexture.height);
  skyGradient.addColorStop(0, '#487fb9');
  skyGradient.addColorStop(0.38, '#89c1eb');
  skyGradient.addColorStop(0.72, '#d7e9ef');
  skyGradient.addColorStop(1, '#f4dca8');
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  const glow = context.createRadialGradient(780, 122, 18, 780, 122, 230);
  glow.addColorStop(0, 'rgba(255, 249, 220, 0.95)');
  glow.addColorStop(0.2, 'rgba(255, 231, 176, 0.42)');
  glow.addColorStop(1, 'rgba(255, 231, 176, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  const haze = context.createLinearGradient(0, canvasTexture.height * 0.56, 0, canvasTexture.height);
  haze.addColorStop(0, 'rgba(255, 255, 255, 0)');
  haze.addColorStop(1, 'rgba(255, 218, 160, 0.33)');
  context.fillStyle = haze;
  context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  for (let index = 0; index < 26; index += 1) {
    const x = hash(index * 1.8) * canvasTexture.width;
    const y = 70 + hash(index * 2.6) * 180;
    const width = 90 + hash(index * 3.7) * 220;
    const height = 16 + hash(index * 4.9) * 24;
    context.fillStyle = `rgba(255, 255, 255, ${0.03 + hash(index * 6.1) * 0.06})`;
    context.beginPath();
    context.ellipse(x, y, width, height, hash(index * 5.4) * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  for (let index = 0; index < 18; index += 1) {
    context.strokeStyle = `rgba(255, 255, 255, ${0.05 + hash(index * 1.9) * 0.04})`;
    context.lineWidth = 3 + hash(index * 3.2) * 4;
    context.beginPath();
    context.moveTo(hash(index * 5.4) * canvasTexture.width, 120 + hash(index * 6.8) * 160);
    context.bezierCurveTo(
      hash(index * 8.1) * canvasTexture.width,
      90 + hash(index * 4.4) * 140,
      hash(index * 9.5) * canvasTexture.width,
      130 + hash(index * 2.2) * 160,
      hash(index * 7.3) * canvasTexture.width,
      95 + hash(index * 3.5) * 170,
    );
    context.stroke();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createCloudTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 256;
  canvasTexture.height = 128;
  const context = canvasTexture.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context unavailable for cloud texture.');
  }

  context.clearRect(0, 0, canvasTexture.width, canvasTexture.height);

  for (let index = 0; index < 9; index += 1) {
    const x = 32 + hash(index * 2.3) * 188;
    const y = 38 + hash(index * 4.1) * 44;
    const radius = 22 + hash(index * 5.7) * 30;
    const puff = context.createRadialGradient(x, y, 4, x, y, radius);
    puff.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = puff;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.colorSpace = SRGBColorSpace;
  return texture;
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
