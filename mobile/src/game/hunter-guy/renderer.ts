import { Asset } from 'expo-asset';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { configureNatureTextures, type TextureKind } from 'hunter-guy/textures';
import { createHunterScene, type HunterScene } from 'hunter-guy/scene';

const sources: Record<TextureKind, number> = {
  ground: require('hunter-guy/assets/ground.png'),
  bark: require('hunter-guy/assets/bark.png'),
  fur: require('hunter-guy/assets/fur.png'),
  needles: require('hunter-guy/assets/needles.png'),
  leaves: require('hunter-guy/assets/leaves.png'),
  sky: require('hunter-guy/assets/sky.png'),
};

export async function loadHunterAssets() {
  const entries = await Promise.all(Object.entries(sources).map(async ([kind, source]) => {
    const asset = await Asset.fromModule(source).downloadAsync();
    if (!asset.localUri || !asset.width || !asset.height) throw new Error(`Could not load ${kind}`);
    return [kind, asset] as const;
  }));
  return Object.fromEntries(entries) as Record<TextureKind, Asset>;
}

export function createNativeHunterRenderer(gl: ExpoWebGLRenderingContext, assets: Record<TextureKind, Asset>, engine?: HunterScene['engine']) {
  configureNatureTextures((kind) => {
    const asset = assets[kind];
    // Expo GL accepts a downloaded Asset as texImage2D data, without a DOM image.
    const texture = new THREE.DataTexture(asset as unknown as Uint8Array<ArrayBuffer>, asset.width!, asset.height!);
    texture.flipY = true;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  });
  const canvas = {
    width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {},
  } as unknown as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGLRenderingContext, antialias: false });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const game = createHunterScene({ aspect: gl.drawingBufferWidth / gl.drawingBufferHeight, engine });
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
      game.engine.setActive(false);
      game.dispose();
      renderer.dispose();
    },
  };
}
export type NativeHunterRenderer = ReturnType<typeof createNativeHunterRenderer>;
