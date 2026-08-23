import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createChickenHopGame,
  startChickenHopRun,
  type ChickenHopEvent,
} from "@viggo-games/chicken-hop-core";
import {
  ChickenHopCanvasParticles,
  syncParticleReset,
} from "../../games/chicken-hop/canvas-particles";
import { ChickenHopAudio } from "../../games/chicken-hop/web-audio";

describe("Chicken Hop browser effects adapters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("turns each shared visual event into one browser particle effect", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const particles = new ChickenHopCanvasParticles();
    const inspect = particles as unknown as {
      lastEventId: number;
      particles: Array<{ kind: "dust" | "feather" | "yolk" }>;
    };
    const events: ChickenHopEvent[] = [
      { id: 1, type: "land", x: 10, y: 20 },
      { id: 2, type: "egg", x: 10, y: 20 },
      { id: 3, type: "flight-feather", x: 10, y: 20 },
      { id: 4, type: "jump", x: 10, y: 20 },
      { id: 5, type: "hurt", x: 10, y: 20 },
      { id: 6, type: "corn", x: 10, y: 20 },
      { id: 7, type: "start" },
    ];

    particles.consume(events);

    expect(inspect.lastEventId).toBe(7);
    expect(inspect.particles.filter(({ kind }) => kind === "dust")).toHaveLength(8);
    expect(inspect.particles.filter(({ kind }) => kind === "yolk")).toHaveLength(13);
    expect(inspect.particles.filter(({ kind }) => kind === "feather")).toHaveLength(31);

    particles.consume(events);
    expect(inspect.particles).toHaveLength(52);
    particles.update(1);
    expect(inspect.particles).toHaveLength(0);
  });

  it("resets browser particles when the shared run resets", () => {
    const particles = new ChickenHopCanvasParticles();
    const reset = vi.spyOn(particles, "reset");
    const game = createChickenHopGame({ seed: 42 });

    syncParticleReset(particles, game, 0);
    expect(reset).toHaveBeenCalledWith(game.eventSequence);

    reset.mockClear();
    startChickenHopRun(game);
    syncParticleReset(particles, game, 1);
    expect(reset).toHaveBeenCalledWith(game.eventSequence);

    reset.mockClear();
    syncParticleReset(particles, game, 0);
    expect(reset).not.toHaveBeenCalled();
  });

  it("routes shared semantic events to the matching browser sounds", () => {
    const audio = new ChickenHopAudio();
    expect(audio.ensure()).toBeFalsy();
    const effects = audio as unknown as Record<string, () => void>;
    const calls: string[] = [];
    for (const effect of [
      "start",
      "jump",
      "land",
      "corn",
      "ouch",
      "egg",
      "bonk",
      "cluckFast",
      "cluckSlow",
    ]) {
      effects[effect] = () => calls.push(effect);
    }

    audio.handle([
      { id: 1, type: "start" },
      { id: 2, type: "jump" },
      { id: 3, type: "land" },
      { id: 4, type: "corn" },
      { id: 5, type: "hurt" },
      { id: 6, type: "egg" },
      { id: 7, type: "gameover" },
      { id: 8, type: "cluck-fast" },
      { id: 9, type: "cluck-slow" },
      { id: 10, type: "flight-feather" },
      { id: 11, type: "life" },
    ]);

    expect(calls).toEqual([
      "start",
      "jump",
      "land",
      "corn",
      "ouch",
      "egg",
      "bonk",
      "cluckFast",
      "cluckSlow",
    ]);
  });
});
