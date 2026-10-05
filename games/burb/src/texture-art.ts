import { CanvasTexture, MathUtils, RepeatWrapping, SRGBColorSpace } from 'three';

export function createRoadTexture() {
  const random = textureRandom(1);
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
    const grain = 18 + random() * 20;
    const warmShift = random() * 3;
    image.data[index] = grain + warmShift;
    image.data[index + 1] = grain + warmShift;
    image.data[index + 2] = grain + 6 + random() * 10;
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
    const x = 70 + random() * (canvasTexture.width - 140);
    const y = random() * canvasTexture.height;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + random() * 30 - 15, y + 70);
    context.stroke();
  }

  const texture = new CanvasTexture(canvasTexture);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createShoulderTexture() {
  const random = textureRandom(2);
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
    const grain = 126 + random() * 36;
    image.data[index] = grain + random() * 16;
    image.data[index + 1] = grain - 14 + random() * 12;
    image.data[index + 2] = grain - 34 + random() * 12;
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
      random() * canvasTexture.width,
      random() * canvasTexture.height,
      8 + random() * 22,
      5 + random() * 14,
      random() * Math.PI,
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

export function createGrassTexture() {
  const random = textureRandom(3);
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
    const green = 92 + random() * 75;
    image.data[index] = 42 + random() * 28;
    image.data[index + 1] = green;
    image.data[index + 2] = 28 + random() * 16;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  for (let patch = 0; patch < 80; patch += 1) {
    context.fillStyle = `rgba(82, 112, 44, ${0.08 + random() * 0.12})`;
    context.beginPath();
    context.ellipse(
      random() * canvasTexture.width,
      random() * canvasTexture.height,
      10 + random() * 26,
      6 + random() * 16,
      random() * Math.PI,
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

export function createSkyTexture() {
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

export function createCloudTexture() {
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

export function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable for bark.');
  ctx.fillStyle = '#b2a394';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1700; i++) {
    const x = (i * 47.3) % 256, y = (i * 31.7) % 256;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(60,47,37,0.3)' : 'rgba(240,218,185,0.2)';
    ctx.lineWidth = 1 + i % 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(i) * 3, y + 8 + i % 35);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}


export function createSpeedSignTexture() {
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

function textureRandom(seed: number) {
  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    return (seed >>> 0) / 4294967296;
  };
}
