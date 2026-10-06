import { Asset } from 'expo-asset';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import type { GunnyEngine } from 'gunny/core';
import { createGunnyScene, type PlanetTextureKind } from 'gunny/scene';

const sources: Record<PlanetTextureKind, number> = {
  day: require('gunny/assets/earth-day.jpg'),
  night: require('gunny/assets/earth-night.jpg'),
  ocean: require('gunny/assets/earth-ocean.jpg'),
  clouds: require('gunny/assets/earth-clouds.jpg'),
  moon: require('gunny/assets/moon.jpg'),
};
export async function loadGunnyAssets() {
  const entries = await Promise.all(Object.entries(sources).map(async ([kind, source]) => {
    const asset = await Asset.fromModule(source).downloadAsync();
    if (!asset.localUri || !asset.width || !asset.height) throw new Error(`Could not load ${kind}`);
    return [kind, asset] as const;
  }));
  return Object.fromEntries(entries) as Record<PlanetTextureKind, Asset>;
}
export function createNativeGunnyRenderer(gl: ExpoWebGLRenderingContext, assets: Record<PlanetTextureKind, Asset>, engine?: GunnyEngine) {
  const canvas = {
    width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {},
  } as unknown as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGLRenderingContext, antialias: false });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = false;
  const game = createGunnyScene({
    aspect: gl.drawingBufferWidth / gl.drawingBufferHeight, renderer, engine,
    loadTexture: (kind) => {
      const asset = assets[kind];
      // Expo GL accepts downloaded Assets as pixels without a DOM image.
      const texture = new THREE.DataTexture(asset as unknown as Uint8Array<ArrayBuffer>, asset.width!, asset.height!);
      texture.flipY = true;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    },
  });
  let disposed = false;
  return {
    game,
    render() {
      if (disposed) return;
      if (canvas.width !== gl.drawingBufferWidth || canvas.height !== gl.drawingBufferHeight) {
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
        game.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
      renderer.render(game.scene, game.camera);
      gl.endFrameEXP();
    },
    dispose() { if (disposed) return; disposed = true; game.dispose(); renderer.dispose(); },
  };
}
export type NativeGunnyRenderer = ReturnType<typeof createNativeGunnyRenderer>;
