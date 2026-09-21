export type { Weapon } from '../scene.js';
import type { Weapon } from '../scene.js';
export const weaponStats: Record<Weapon, { name: string; cooldown: number; range: number }>;
export function terrainHeight(x: number, z: number): number;
export const LOOK_RANGE: number;
export const TOUCH_LOOK_SENSITIVITY: number;
export function touchMoveVector(x: number, y: number): { x: number; y: number };
export interface Animal {
  type: string; name: string; hp: number; alive: boolean; moving: boolean; scaredFor: number;
  group: { position: { x: number; y: number; z: number }; rotation: { y: number }; visible: boolean };
}
export interface HunterState {
  active: boolean; score: number; time: number; cooldown: number; message: string; selectedWeapon: Weapon;
  player: { x: number; y: number; z: number; yaw: number; pitch: number };
  animals: Animal[];
  hunters: { group: { position: { x: number; y: number; z: number }; rotation: { y: number } } }[];
}
export function createHunterGame(options?: { seed?: number; colliders?: { x: number; z: number; radius: number }[] }): {
  state: HunterState;
  setActive(active: boolean): void;
  setWeapon(weapon: Weapon): void;
  setMessage(text: string, seconds?: number): void;
  look(yaw: number, pitch: number): void;
  step(delta: number, input?: { forward?: number; strafe?: number; turn?: number }): void;
  fire(hit?: { animalIndex: number; distance: number }): boolean;
};
