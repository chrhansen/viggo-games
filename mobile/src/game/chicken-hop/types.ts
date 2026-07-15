export type ChickenHopMode = "ready" | "playing" | "paused" | "gameover";

export interface ChickenHopInput {
  jump: boolean;
  left: boolean;
  right: boolean;
}

export interface ChickenHopPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  groundObstacleId: number | null;
  jumpBuffer: number;
  coyote: number;
  flyHold: number;
  invulnerableFor: number;
}

export interface ChickenHopObstacle {
  id: number;
  kind: "block" | "book" | "plant" | "robot";
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChickenHopPickup {
  id: number;
  kind: "corn" | "gold-corn";
  value: 1 | 3;
  x: number;
  y: number;
  radius: number;
  phase: number;
}

export interface ChickenHopEgg {
  id: number;
  x: number;
  y: number;
  radius: number;
  phase: number;
}

export interface ChickenHopGame {
  mode: ChickenHopMode;
  elapsed: number;
  score: number;
  best: number;
  corn: number;
  hearts: [number, number];
  heartIndex: 0 | 1;
  flyFuel: number;
  flyFuelMax: number;
  flyRefuelFor: number;
  speed: number;
  difficulty: number;
  scroll: number;
  width: number;
  height: number;
  floorY: number;
  leftBound: number;
  rightBound: number;
  player: ChickenHopPlayer;
  obstacles: ChickenHopObstacle[];
  pickups: ChickenHopPickup[];
  eggs: ChickenHopEgg[];
  obstacleTimer: number;
  pickupTimer: number;
  eggTimer: number;
  randomSeed: number;
  nextEntityId: number;
  jumpWasHeld: boolean;
  feedback: "corn" | "egg" | "hurt" | "life" | null;
  feedbackId: number;
}
