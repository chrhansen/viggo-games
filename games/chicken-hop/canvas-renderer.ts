import type { ChickenHopGame, ChickenProfile } from "@viggo-games/chicken-hop-core";
import {
  drawChickenHopName,
  drawChickenHopPlayer,
} from "./canvas-chicken";
import { drawChickenHopEntities } from "./canvas-entities";
import { ChickenHopCanvasParticles, syncParticleReset } from "./canvas-particles";
import {
  drawChickenHopForeground,
  drawChickenHopRoom,
} from "./canvas-room";

export class ChickenHopCanvasRenderer {
  private particles = new ChickenHopCanvasParticles();
  private previousElapsed = 0;
  private shake = 0;

  constructor(private context: CanvasRenderingContext2D) {}

  render(game: ChickenHopGame, profile: ChickenProfile, delta: number) {
    syncParticleReset(this.particles, game, this.previousElapsed);
    this.previousElapsed = game.elapsed;
    this.particles.consume(game.events);
    this.particles.update(delta);
    for (const event of game.events) {
      if (event.type === "hurt") this.shake = Math.max(this.shake, 0.1);
      else if (event.type === "life") this.shake = Math.max(this.shake, 0.18);
    }
    this.shake = Math.max(0, this.shake - delta);

    const shakeX =
      this.shake > 0
        ? Math.sin(game.elapsed * 60) * this.shake * 12
        : 0;
    const shakeY =
      this.shake > 0
        ? Math.cos(game.elapsed * 55) * this.shake * 8
        : 0;
    this.context.save();
    this.context.translate(shakeX, shakeY);
    drawChickenHopRoom(this.context, game);
    drawChickenHopEntities(this.context, game);
    drawChickenHopPlayer(this.context, game, profile);
    this.particles.draw(this.context);
    drawChickenHopName(this.context, game, profile.name);
    drawChickenHopForeground(this.context, game);
    this.context.restore();
  }
}
