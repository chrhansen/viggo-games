import type { ChickenHopGame } from "./types";

export function nextRandom(game: ChickenHopGame) {
  game.randomSeed =
    (Math.imul(game.randomSeed, 1664525) + 1013904223) >>> 0;
  return game.randomSeed / 4294967296;
}

export function randomBetween(
  game: ChickenHopGame,
  minimum: number,
  maximum: number,
) {
  return minimum + nextRandom(game) * (maximum - minimum);
}

export function randomInteger(
  game: ChickenHopGame,
  minimum: number,
  maximum: number,
) {
  return Math.floor(randomBetween(game, minimum, maximum + 1));
}

export function nextEntityId(game: ChickenHopGame) {
  const id = game.nextEntityId;
  game.nextEntityId += 1;
  return id;
}
