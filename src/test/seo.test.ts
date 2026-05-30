import { describe, expect, it } from "vitest";
import { games, gamesById } from "@/data/games";
import { gameSeo, homeSeo, SITE_URL } from "@/lib/seo";

describe("seo metadata", () => {
  it("builds homepage metadata with current games", () => {
    const metadata = homeSeo(games);

    expect(metadata.title).toContain("Free Browser Arcade Games");
    expect(metadata.path).toBe("/");
    expect(JSON.stringify(metadata.jsonLd)).toContain("Chicken Hop");
  });

  it("builds canonical game metadata", () => {
    const metadata = gameSeo(gamesById.gunny);

    expect(metadata.path).toBe("/gunny");
    expect(metadata.image).toBe("/seo/gunny.webp");
    expect(JSON.stringify(metadata.jsonLd)).toContain(`${SITE_URL}/games/gunny/`);
  });
});
