import type { Group, Mesh, PerspectiveCamera, Scene, Texture, Vector3 } from 'three';

export type TorpedoView = 'front' | 'port' | 'starboard' | 'periscope';
export type RoomAction = 'steer' | 'sonar' | 'rest' | 'eat' | 'repair';
export interface TorpedoSnapshot {
  started: boolean; active: boolean; gameOver: boolean; score: number; bossesDefeated: number;
  hull: number; maxHull: number; engineBroken: boolean; ready: boolean;
  view: TorpedoView; viewTitle: string; status: string; hit: boolean;
}
export class TorpedoGame {
  constructor(callbacks?: { onChange?: (state: TorpedoSnapshot) => void; onDamage?: () => void; onGameOver?: () => void; onSaveBossCount?: (count: number) => void });
  scene: Scene;
  camera: PerspectiveCamera;
  world: Group;
  keys: Set<string>;
  player: { position: Vector3; hull: number; score: number; forwardSpeed: number; cooldown: number; engineBroken: boolean };
  enemies: { mesh: Group; speed: number; shootTimer: number }[];
  playerTorpedoes: { mesh: Group; velocity: Vector3; life: number }[];
  enemyTorpedoes: { mesh: Group; velocity: Vector3; life: number }[];
  input: { vector(): { x: number; y: number } };
  textures: { get(kind: string): Texture; dispose(): void };
  environment: { floorChunks: Mesh[] };
  effects: { bursts: { mesh: Mesh; age: number }[] };
  bossLoop: {
    regularKills: number; waitingForPickup: boolean;
    boss: { mesh: Group; health: number; maxHealth: number } | null;
    regularKillsNeeded(): number;
    update(delta: number): void;
    updatePickupSubs(delta: number): void;
    fireBossSalvo(direction: Vector3): void;
    hitBoss(torpedo: { mesh: { position: Vector3 } }): boolean;
  };
  running: boolean;
  paused: boolean;
  isGameOver: boolean;
  readonly active: boolean;
  view: TorpedoView;
  periscopeYaw: number;
  start(): void;
  pause(): void;
  resume(): void;
  restart(bossesDefeated?: number): void;
  startPatrol(bossesDefeated?: number): void;
  saveBossCount(): void;
  clearKeys(): void;
  setTouchInput(x: number, y: number): void;
  clearTouchInput(): void;
  setView(view: TorpedoView): void;
  togglePeriscope(): TorpedoView;
  resize(width: number, height: number): void;
  step(delta: number): void;
  firePlayerTorpedo(): void;
  spawnEnemy(): void;
  checkCollisions(): void;
  damagePlayer(amount: number): void;
  createBurst(position: Vector3, color: string): void;
  currentDirection(): Vector3;
  performInteriorAction(action: RoomAction): string;
  getSnapshot(): TorpedoSnapshot;
  dispose(): void;
}
