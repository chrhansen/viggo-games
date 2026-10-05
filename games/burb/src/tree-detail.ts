import { Color, ConeGeometry, Float32BufferAttribute } from 'three';

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
