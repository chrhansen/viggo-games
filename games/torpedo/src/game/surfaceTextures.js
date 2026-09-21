import * as THREE from 'three';

const textures = new Map();

export function surfaceTexture(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 417;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed / 4294967296 - 0.5);
      const ripple = Math.sin(y * Math.PI / 16 + Math.sin(x * Math.PI / 64) * 1.8);
      const seam = x % 64 === 0 || y % 32 === 0;
      const value = kind === 'sand'
        ? 170 + ripple * 18 + grain * 34
        : 175 + grain * 24 - (seam ? 38 : 0) + Math.sin(x * 0.22) * Math.sin(y * 0.11) * 12;
      const offset = (y * size + x) * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(kind === 'sand' ? 48 : 2, kind === 'sand' ? 48 : 1);
  texture.needsUpdate = true;
  textures.set(kind, texture);
  return texture;
}
