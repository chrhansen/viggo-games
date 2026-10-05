import { Asset } from 'expo-asset';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import type { BurbGame } from 'burb/core';
import { createBurbScene } from 'burb/scene';
import type { BurbTextureKind } from 'burb/textures';

const sources: Record<BurbTextureKind, number> = {
  road: require('burb/assets/road.png'),
  shoulder: require('burb/assets/shoulder.png'),
  grass: require('burb/assets/grass.png'),
  bark: require('burb/assets/bark.png'),
  sky: require('burb/assets/sky.png'),
  cloud: require('burb/assets/cloud.png'),
  sign: require('burb/assets/sign.png'),
};

export async function loadBurbAssets() {
  const entries = await Promise.all(Object.entries(sources).map(async ([kind, source]) => {
    const asset = await Asset.fromModule(source).downloadAsync();
    if (!asset.localUri || !asset.width || !asset.height) throw new Error(`Could not load ${kind}`);
    return [kind, asset] as const;
  }));
  return Object.fromEntries(entries) as Record<BurbTextureKind, Asset>;
}

export function createNativeBurbRenderer(gl: ExpoWebGLRenderingContext, assets: Record<BurbTextureKind, Asset>, engine?: BurbGame) {
  const canvas = {
    width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {},
  } as unknown as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGLRenderingContext, antialias: false });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const game = createBurbScene({
    aspect: gl.drawingBufferWidth / gl.drawingBufferHeight,
    anisotropy: Math.min(4, renderer.capabilities.getMaxAnisotropy()),
    engine,
    textures: (kind) => {
      const asset = assets[kind];
      // Expo GL accepts a downloaded Asset as texture pixels without a DOM image.
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
    dispose() {
      if (disposed) return;
      disposed = true;
      game.dispose();
      renderer.dispose();
    },
  };
}
export type NativeBurbRenderer = ReturnType<typeof createNativeBurbRenderer>;
