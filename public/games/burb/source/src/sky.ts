import { BackSide, CanvasTexture, Group, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, SRGBColorSpace } from 'three';

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


function hash(value: number) { return MathUtils.euclideanModulo(Math.sin(value * 91.31) * 43758.5453123, 1); }
