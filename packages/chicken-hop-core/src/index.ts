export {
  advanceChickenHopGame,
  createChickenHopGame,
  emptyChickenHopInput,
  resizeChickenHopGame,
  setChickenHopTimeMode,
  snapshotChickenHopGame,
  startChickenHopRun,
  toggleChickenHopPause,
} from "./engine";

export {
  chickenColorIds,
  chickenDesignIds,
  chickenNames,
  defaultChickenProfile,
  normalizeChickenName,
  randomChickenName,
} from "./profile";

export type {
  ChickenHopEgg,
  ChickenHopEvent,
  ChickenHopEventType,
  ChickenHopGame,
  ChickenHopGroundRef,
  ChickenHopInput,
  ChickenHopMode,
  ChickenHopObstacle,
  ChickenHopObstacleKind,
  ChickenHopPickup,
  ChickenHopPlatform,
  ChickenHopPlayer,
  ChickenHopTimeMode,
  CreateChickenHopOptions,
} from "./types";

export type { ChickenColor, ChickenDesign, ChickenProfile } from "./profile";
