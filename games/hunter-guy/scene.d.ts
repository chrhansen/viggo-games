import type { Scene, PerspectiveCamera } from 'three';
import type { createHunterGame } from './core/engine.js';
export type Weapon = 'rifle' | 'bow' | 'knife' | 'squirt';
export interface HunterInput { forward?: number; strafe?: number; turn?: number }
export interface HunterScene {
  scene: Scene;
  camera: PerspectiveCamera;
  engine: ReturnType<typeof createHunterGame>;
  fire(): boolean;
  step(delta: number, input?: HunterInput): void;
  sync(delta?: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}
export function createHunterScene(options?: { aspect?: number; seed?: number; engine?: ReturnType<typeof createHunterGame> }): HunterScene;
