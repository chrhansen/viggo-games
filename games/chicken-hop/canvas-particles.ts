import type {
  ChickenHopEvent,
  ChickenHopGame,
} from "@viggo-games/chicken-hop-core";
import { lerp, roundedRect } from "./canvas-utils";

interface CanvasParticle {
  elapsed: number;
  kind: "dust" | "feather" | "yolk";
  lifetime: number;
  rotation?: number;
  rotationVelocity?: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const randomBetween = (minimum: number, maximum: number) =>
  minimum + Math.random() * (maximum - minimum);

export class ChickenHopCanvasParticles {
  private lastEventId = 0;
  private particles: CanvasParticle[] = [];

  reset(eventSequence: number) {
    this.lastEventId = eventSequence;
    this.particles = [];
  }

  consume(events: ChickenHopEvent[]) {
    for (const event of events) {
      if (event.id <= this.lastEventId) continue;
      this.lastEventId = event.id;
      const x = event.x ?? 0;
      const y = event.y ?? 0;
      if (event.type === "land") this.spawnDust(x, y);
      else if (event.type === "egg") this.spawnYolk(x, y);
      else if (event.type === "flight-feather") this.spawnFeathers(x, y, 4);
      else if (
        event.type === "jump" ||
        event.type === "hurt" ||
        event.type === "corn"
      ) {
        this.spawnFeathers(x, y, Math.floor(randomBetween(7, 12)));
      }
    }
  }

  update(delta: number) {
    for (const particle of this.particles) {
      particle.elapsed += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += (particle.kind === "dust" ? 1200 : 1800) * delta;
      if (particle.rotation !== undefined) {
        particle.rotation += (particle.rotationVelocity ?? 0) * delta;
      }
    }
    this.particles = this.particles.filter(
      ({ elapsed, lifetime }) => elapsed < lifetime,
    );
  }

  draw(context: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      const progress = particle.elapsed / particle.lifetime;
      const alpha = 1 - progress;
      if (particle.kind === "dust") {
        context.globalAlpha = alpha * 0.35;
        context.fillStyle = "rgba(255,255,255,0.55)";
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          lerp(6, 14, progress),
          0,
          Math.PI * 2,
        );
        context.fill();
        context.globalAlpha = 1;
        continue;
      }
      if (particle.kind === "yolk") {
        context.globalAlpha = alpha * 0.55;
        context.fillStyle = "rgba(255, 214, 102, 0.85)";
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          lerp(2.5, 6.5, progress),
          0,
          Math.PI * 2,
        );
        context.fill();
        context.globalAlpha = 1;
        continue;
      }

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation ?? 0);
      context.globalAlpha = alpha * 0.7;
      roundedRect(context, -6, -2, 12, 4, 2);
      context.fillStyle = "#FFF7EA";
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.12)";
      context.lineWidth = 1.5;
      context.stroke();
      context.restore();
    }
    context.globalAlpha = 1;
  }

  private spawnFeathers(x: number, y: number, count: number) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        elapsed: 0,
        kind: "feather",
        lifetime: randomBetween(0.35, 0.65),
        rotation: randomBetween(0, Math.PI * 2),
        rotationVelocity: randomBetween(-10, 10),
        vx: randomBetween(-240, 240),
        vy: randomBetween(-520, -120),
        x,
        y,
      });
    }
  }

  private spawnDust(x: number, y: number) {
    const count = Math.floor(randomBetween(6, 11));
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        elapsed: 0,
        kind: "dust",
        lifetime: randomBetween(0.25, 0.45),
        vx: randomBetween(-140, 140),
        vy: randomBetween(-220, -40),
        x: x + randomBetween(-10, 10),
        y: y + randomBetween(-6, 6),
      });
    }
  }

  private spawnYolk(x: number, y: number) {
    const count = Math.floor(randomBetween(10, 17));
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        elapsed: 0,
        kind: "yolk",
        lifetime: randomBetween(0.25, 0.45),
        vx: randomBetween(-260, 260),
        vy: randomBetween(-520, -160),
        x,
        y,
      });
    }
  }
}

export function syncParticleReset(
  particles: ChickenHopCanvasParticles,
  game: ChickenHopGame,
  previousElapsed: number,
) {
  if (game.mode === "ready" || game.elapsed < previousElapsed) {
    particles.reset(game.eventSequence);
  }
}
