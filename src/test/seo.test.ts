import { describe, expect, it } from "vitest";
import { games, gamesById } from "@/data/games";
import { aboutSeo, DEFAULT_SOCIAL_IMAGE, gameSeo, homeSeo, SITE_URL } from "@/lib/seo";

describe("seo metadata", () => {
  it("builds homepage metadata with current games", () => {
    const metadata = homeSeo(games);

    expect(metadata.title).toContain("Free Browser Arcade Games");
    expect(metadata.path).toBe("/");
    expect(metadata.image).toBe(DEFAULT_SOCIAL_IMAGE);
    expect(metadata.imageWidth).toBe(1200);
    expect(metadata.imageHeight).toBe(630);
    expect(JSON.stringify(metadata.jsonLd)).toContain("Chicken Hop");
  });

  it("builds canonical game metadata", () => {
    const metadata = gameSeo(gamesById.gunny);
    const jsonLd = JSON.stringify(metadata.jsonLd);

    expect(metadata.path).toBe("/gunny/");
    expect(metadata.title).toBe(gamesById.gunny.seoTitle);
    expect(metadata.image).toBe("/seo/gunny.webp");
    expect(metadata.imageAlt).toBe(gamesById.gunny.imageAlt);
    expect(jsonLd).toContain(`${SITE_URL}/games/gunny/`);
    expect(jsonLd).toContain('"@type":"PlayAction"');
    expect(jsonLd).not.toContain('"sameAs":"https://viggo.games/games/gunny/"');
  });

  it("uses one trailing-slash URL shape for every public route", () => {
    const routePaths = games.map((game) => game.routePath);

    expect(routePaths.every((path) => path.endsWith("/"))).toBe(true);
    expect(new Set(routePaths).size).toBe(games.length);
    expect(aboutSeo().path).toBe("/about/");
  });

  it("keeps game search snippets unique and concise", () => {
    const metadata = games.map(gameSeo);

    expect(new Set(metadata.map((item) => item.title)).size).toBe(games.length);
    metadata.forEach((item) => {
      expect(item.title.length).toBeLessThanOrEqual(65);
      expect(item.description.length).toBeGreaterThanOrEqual(90);
      expect(item.description.length).toBeLessThanOrEqual(160);
    });
  });
});
