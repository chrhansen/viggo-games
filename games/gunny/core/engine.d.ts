export interface Vector { x: number; y: number; z: number }
export interface GunnyInput { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean }
export interface GunnyState {
  health: number; score: number; kills: number; distance: number; time: number;
  active: boolean; started: boolean; finished: boolean; result: 'win' | 'lose' | null;
}
export interface Craft { position: Vector; rotation: Vector; scale: number }
export interface Player extends Craft { velocity: Vector; cooldown: number; damageFlash: number }
export interface Enemy extends Craft {
  id: number; hp: number; radius: number; driftX: number; driftY: number; phase: number; fireCooldown: number;
}
export interface Satellite extends Craft { id: number; radius: number; spin: Vector }
export interface Shot { id: number; position: Vector; velocity: Vector; radius: number }
export interface Explosion {
  id: number; position: Vector; color: number; scale: number; large: boolean;
  age: number; life: number; raiderBlast: boolean; damagedPlayer: boolean;
}
export const MISSION_KILLS: number;
export const EXPLOSION_LIFETIME: number;
export const IMPACT_LIFETIME: number;
export function emptyGunnyInput(): GunnyInput;
export function isCriticalHull(state: GunnyState): boolean;
export class GunnyEngine {
  constructor(options?: { random?: () => number });
  state: GunnyState;
  player: Player;
  enemies: Enemy[];
  satellites: Satellite[];
  playerShots: Shot[];
  enemyShots: Shot[];
  explosions: Explosion[];
  enemySpawnTimer: number;
  satelliteSpawnTimer: number;
  readonly criticalHull: boolean;
  reset(): void;
  start(): void;
  setActive(active: boolean): void;
  step(delta: number, input?: GunnyInput): number;
  spawnEnemy(): void;
  spawnSatellite(): void;
  firePlayerShot(): void;
  fireEnemyShot(enemy: Enemy): void;
  damagePlayer(amount: number): void;
  spawnExplosion(position: Vector, color: number, scale: number, raiderBlast?: boolean): void;
  updateExplosions(delta: number): void;
  updateProjectiles(delta: number): void;
  checkMissionState(): void;
}
