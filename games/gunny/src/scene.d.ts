import type * as THREE from 'three';
import type { GunnyEngine, GunnyInput } from '../core/engine.js';
export type PlanetTextureKind = 'moon' | 'clouds' | 'day' | 'night' | 'ocean';
export function createGunnyScene(options: {
  aspect: number; loadTexture: (kind: PlanetTextureKind) => THREE.Texture;
  renderer?: THREE.WebGLRenderer; engine?: GunnyEngine;
}): {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; engine: GunnyEngine;
  sync(delta?: number): void; resetCamera(): void;
  step(delta: number, input?: GunnyInput): void;
  preview(delta: number): void;
  resize(width: number, height: number): void; dispose(): void;
};
