import { CanvasTexture, Color, ConeGeometry, Float32BufferAttribute, RepeatWrapping, SRGBColorSpace } from 'three';

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

export function detailedPineGeometry(radius: number, height: number) {
  const geometry = new ConeGeometry(radius, height, 14, 4);
  const position = geometry.getAttribute('position');
  const colors: number[] = [];
  const color = new Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const level = (position.getY(i) + height / 2) / height;
    const reach = 1 + Math.sin(angle * 7) * 0.11 + Math.cos(angle * 5 + level * 10) * 0.08;
    position.setX(i, x * reach);
    position.setZ(i, z * reach);
    color.setRGB(0.72 + level * 0.25, 0.78 + level * 0.2, 0.65 + level * 0.25);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
