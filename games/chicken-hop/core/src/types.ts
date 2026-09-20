export type ChickenHopMode = "ready" | "playing" | "paused" | "gameover";
export type ChickenHopTimeMode = "slow" | "normal" | "fast";

export interface ChickenHopInput {
  down: boolean;
  jump: boolean;
  left: boolean;
  right: boolean;
}

export interface ChickenHopPlayer {
  animation: number;
  cluckCooldown: number;
  coyote: number;
  dropThroughFor: number;
  flyHold: number;
  ground: ChickenHopGroundRef | null;
  height: number;
  invulnerableFor: number;
  jumpBuffer: number;
  onGround: boolean;
  vx: number;
  vy: number;
  width: number;
  x: number;
  y: number;
}

export interface ChickenHopGroundRef {
  id: number;
  type: "obstacle" | "platform";
}

export type ChickenHopObstacleKind = "block" | "book" | "plant" | "robot";

export interface ChickenHopObstacle {
  color: string;
  height: number;
  id: number;
  kind: ChickenHopObstacleKind;
  width: number;
  x: number;
  y: number;
}

export interface ChickenHopPlatform {
  floorOffset: number;
  height: number;
  id: number;
  kind: "shelf" | "step";
  width: number;
  x: number;
  y: number;
}

export interface ChickenHopPickup {
  elapsed: number;
  id: number;
  kind: "corn" | "gold-corn";
  radius: number;
  taken: boolean;
  value: 1 | 3;
  x: number;
  y: number;
}

export interface ChickenHopEgg {
  elapsed: number;
  id: number;
  radius: number;
  smashed: boolean;
  smashedFor: number;
  x: number;
  y: number;
}

export type ChickenHopEventType =
  | "cluck-fast"
  | "cluck-slow"
  | "corn"
  | "egg"
  | "flight-feather"
  | "gameover"
  | "hurt"
  | "jump"
  | "land"
  | "life"
  | "start";

export interface ChickenHopEvent {
  id: number;
  type: ChickenHopEventType;
  value?: number;
  x?: number;
  y?: number;
}

export interface ChickenHopSpawnerState {
  cooldown: number;
  needsLanding: boolean;
  runChunksLeft: number;
}

export interface ChickenHopTerrainState {
  level: 0 | 1;
  runLeft: number;
}

export interface ChickenHopGame {
  best: number;
  corn: number;
  difficulty: number;
  eggSpawnerCooldown: number;
  eggs: ChickenHopEgg[];
  elapsed: number;
  eventSequence: number;
  events: ChickenHopEvent[];
  flyFeatherCooldown: number;
  flyFuel: number;
  flyFuelMax: number;
  flyRefuelDelay: number;
  flyRefuelFor: number;
  floorY: number;
  gravity: number;
  heartIndex: 0 | 1;
  hearts: [number, number];
  height: number;
  jumpVelocity: number;
  leftBound: number;
  mode: ChickenHopMode;
  nextEntityId: number;
  obstacleSpawner: ChickenHopSpawnerState;
  obstacles: ChickenHopObstacle[];
  pickups: ChickenHopPickup[];
  platformSpawnerCooldown: number;
  platforms: ChickenHopPlatform[];
  plateauLift: number;
  player: ChickenHopPlayer;
  randomSeed: number;
  rightBound: number;
  roomHue: number;
  roomHueAccent: number;
  roomHueAccentTwo: number;
  score: number;
  scroll: number;
  speed: number;
  terrain: ChickenHopTerrainState;
  timeMode: ChickenHopTimeMode;
  timeScale: number;
  width: number;
}

export interface CreateChickenHopOptions {
  best?: number;
  height?: number;
  seed?: number;
  width?: number;
}
