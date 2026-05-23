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

  it("keeps homepage taglines available for every game", () => {
    expect(games.every((game) => game.tagline.trim().length > 0)).toBe(true);
  });

  it("keeps SEO metadata available for every game", () => {
    expect(
      games.every(
        (game) =>
          game.routePath === `/${game.id}` &&
          game.urlPath === `/games/${game.id}/` &&
          game.description.length > game.tagline.length &&
          game.metaDescription.includes("viggo.games") &&
          game.keywords.length >= 4,
      ),
    ).toBe(true);
  });
});
