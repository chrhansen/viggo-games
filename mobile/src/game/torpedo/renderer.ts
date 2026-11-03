import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import type { TorpedoGame } from 'torpedo/game';

export function createNativeTorpedoRenderer(gl: ExpoWebGLRenderingContext, game: TorpedoGame) {
  const canvas = {
    width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {},
  } as unknown as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGLRenderingContext, antialias: false });
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  game.resize(canvas.width, canvas.height);
  let disposed = false;
  return {
    resize(width: number, height: number) {
      if (disposed || width <= 0 || height <= 0 || (canvas.width === width && canvas.height === height)) return;
      renderer.setSize(width, height, false);
      game.resize(width, height);
    },
    render() {
      if (disposed) return;
      renderer.render(game.scene, game.camera);
      gl.endFrameEXP();
    },
    dispose() { if (disposed) return; disposed = true; renderer.dispose(); },
  };
}
export type NativeTorpedoRenderer = ReturnType<typeof createNativeTorpedoRenderer>;
