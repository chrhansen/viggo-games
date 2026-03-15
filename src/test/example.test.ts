import { describe, expect, it } from "vitest";
import { games, gamesById } from "@/data/games";

describe("games registry", () => {
  it("includes Gunny with the hosted game path", () => {
    expect(gamesById.gunny).toMatchObject({
      id: "gunny",
      title: "Gunny",
      level: "Level 04",
      url: expect.stringContaining("/games/gunny/"),
    });
  });

  it("keeps game ids unique", () => {
    const ids = games.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
