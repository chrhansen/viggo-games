import * as THREE from "three";

const textureCache = {};

function makeTexture(width, height, sample, colorSpace = THREE.NoColorSpace) {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) pixels.set([...sample(x, y), 255], (y * width + x) * 4);
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = colorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function getSolarPanelMaps() {
  if (!textureCache.solarPanels) {
    const panelMap = makeTexture(512, 256, (x, y) => {
      const cellX = x % 32, cellY = y % 32;
      if (cellX < 2 || cellY < 2) return [104, 119, 136];
      if (Math.min(cellX, 32 - cellX) + Math.min(cellY, 32 - cellY) < 6) return [10, 17, 26];
      if (cellX === 10 || cellX === 22) return [73, 108, 152];
      const crystal = Math.sin(Math.floor(x / 32) * 9 + Math.floor(y / 32) * 7) * 7;
      const grid = cellY % 4 === 0 ? 12 : 0;
      return [16 + grid, 36 + crystal + grid, 75 + crystal + grid];
    }, THREE.SRGBColorSpace);
    textureCache.solarPanels = { panelMap };
  }
  return textureCache.solarPanels;
}

export function getFoilBumpMap() {
  if (!textureCache.foil) {
    textureCache.foil = makeTexture(128, 128, (x, y) => {
      const crease = Math.abs(Math.sin(x * 0.31 + Math.sin(y * 0.22) * 2)
        * Math.cos(y * 0.27 + Math.cos(x * 0.19)));
      const height = 90 + Math.pow(crease, 0.35) * 100;
      return [height, height, height];
    });
  }
  return textureCache.foil;
}

export function getHullPanelMap() {
  if (!textureCache.hull) {
    textureCache.hull = makeTexture(256, 256, (x, y) => {
      const edge = x % 64 < 1 || y % 48 < 1;
      const fastener = x % 64 === 5 && y % 48 === 5;
      const height = edge ? 90 : fastener ? 105 : 135;
      return [height, height, height];
    });
  }
  return textureCache.hull;
}
