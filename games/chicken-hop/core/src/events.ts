import type {
  ChickenHopEventType,
  ChickenHopGame,
} from "./types";

export function emitChickenHopEvent(
  game: ChickenHopGame,
  type: ChickenHopEventType,
  details: { value?: number; x?: number; y?: number } = {},
) {
  game.eventSequence += 1;
  game.events.push({ id: game.eventSequence, type, ...details });
}
