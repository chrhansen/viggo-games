import {
  advanceChickenHopGame,
  createChickenHopGame,
  resizeChickenHopGame,
  setChickenHopTimeMode,
  startChickenHopRun,
  toggleChickenHopPause,
} from "@viggo-games/chicken-hop-core";
import { ChickenHopCanvasRenderer } from "./canvas-renderer";
import { clamp } from "./canvas-utils";
import { ChickenHopAudio } from "./web-audio";
import { ChickenHopWebInput } from "./web-input";
import { ChickenHopWebUi } from "./web-ui";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Missing Chicken Hop canvas");
const context = canvas.getContext("2d", { alpha: false });
if (!context) throw new Error("Chicken Hop requires Canvas 2D support");

const fitCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(320, Math.floor(rect.width * pixelRatio));
  const height = Math.max(240, Math.floor(rect.height * pixelRatio));
  const changed = canvas.width !== width || canvas.height !== height;
  if (changed) {
    canvas.width = width;
    canvas.height = height;
  }
  return changed;
};

fitCanvas();
const ui = new ChickenHopWebUi();
const audio = new ChickenHopAudio();
const game = createChickenHopGame({
  best: ChickenHopWebUi.loadBest(),
  height: canvas.height,
  seed: Date.now(),
  width: canvas.width,
});
const renderer = new ChickenHopCanvasRenderer(context);
let previousMode = game.mode;
let idleElapsed = 0;

const start = () => {
  audio.ensure();
  startChickenHopRun(game);
  ui.persistBest(game.best);
  audio.handle(game.events);
  ui.hideOverlay();
  input.clear();
};

const pause = () => {
  toggleChickenHopPause(game);
  input.clear();
  if (game.mode === "paused") ui.showPaused();
  else if (game.mode === "playing") ui.hideOverlay();
};

const restart = () => start();

const input = new ChickenHopWebInput(ui.touchMode, {
  ensureAudio: () => {
    audio.ensure();
  },
  getMode: () => game.mode,
  onPause: pause,
  onRestart: restart,
  onStart: start,
  onTimeMode: (mode) => {
    setChickenHopTimeMode(game, mode);
    ui.setTimeMode(mode);
  },
});

window.addEventListener(
  "resize",
  () => {
    if (fitCanvas()) resizeChickenHopGame(game, canvas.width, canvas.height);
  },
  { passive: true },
);

let previousTime = performance.now();
const frame = (time: number) => {
  const realDelta = clamp((time - previousTime) / 1000, 0, 1 / 20);
  previousTime = time;
  idleElapsed += realDelta;
  if (fitCanvas()) resizeChickenHopGame(game, canvas.width, canvas.height);
  advanceChickenHopGame(game, input.getInput(), realDelta);
  audio.handle(game.events);

  if (game.mode !== previousMode) {
    if (game.mode === "gameover") ui.showGameOver(game);
    else if (game.mode === "paused") ui.showPaused();
    else if (game.mode === "playing") ui.hideOverlay();
    previousMode = game.mode;
  }

  renderer.render(game, ui.getProfile(), realDelta);
  ui.update(game, realDelta, idleElapsed);
  requestAnimationFrame(frame);
};

ui.setTimeMode(game.timeMode);
requestAnimationFrame(frame);
