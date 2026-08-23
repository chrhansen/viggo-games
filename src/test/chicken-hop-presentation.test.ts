import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { chickenColorIds, chickenDesignIds } from "@viggo-games/chicken-hop-core";

const mobileRoot = path.resolve(process.cwd(), "mobile", "src");
const repoRoot = process.cwd();

describe("Chicken Hop native presentation regressions", () => {
  it("renders kernels without corn-cob emoji artwork", () => {
    const scene = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-scene.tsx"),
      "utf8",
    );
    const hud = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-hud.tsx"),
      "utf8",
    );

    expect(scene).not.toContain("🌽");
    expect(hud).not.toContain("🌽");
    expect(scene).toContain("CornKernel");
    expect(hud).toContain("CornKernel");
  });

  it("draws the game edge-to-edge while insetting interactive controls", () => {
    const screen = fs.readFileSync(
      path.join(mobileRoot, "app", "chicken-hop.tsx"),
      "utf8",
    );

    expect(screen).toContain("useSafeAreaInsets");
    expect(screen).not.toContain("<SafeAreaView");
    expect(screen).toContain("safeLeft={insets.left}");
    expect(screen).toContain("safeRight={insets.right}");
  });

  it("shows jump and flight feathers plus an obvious pause control", () => {
    const feathers = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-feathers.tsx"),
      "utf8",
    );
    const featherModel = fs.readFileSync(
      path.join(
        mobileRoot,
        "components",
        "chicken-hop",
        "chicken-hop-feather-model.ts",
      ),
      "utf8",
    );
    const scene = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-scene.tsx"),
      "utf8",
    );
    const screen = fs.readFileSync(
      path.join(mobileRoot, "app", "chicken-hop.tsx"),
      "utf8",
    );

    expect(scene).toContain("ChickenHopFeathers");
    expect(scene).toContain("transformOrigin: \"top left\"");
    expect(feathers).toContain("advanceFeatherState");
    expect(featherModel).toContain("game.events");
    expect(featherModel).toContain('event.type === "jump"');
    expect(featherModel).toContain('event.type === "flight-feather"');
    expect(screen).toContain("engine.events.length > 0");
    expect(screen).toContain('game.mode === "paused" ? "▶  RESUME" : "Ⅱ  PAUSE"');
    expect(screen).toContain("styles.pauseButton");
  });

  it("routes browser and native gameplay through the shared engine only", () => {
    const browserEntry = fs.readFileSync(
      path.join(repoRoot, "games", "chicken-hop", "game.ts"),
      "utf8",
    );
    const browserHtml = fs.readFileSync(
      path.join(repoRoot, "games", "chicken-hop", "index.html"),
      "utf8",
    );
    const nativeAdapter = fs.readFileSync(
      path.join(mobileRoot, "game", "chicken-hop", "engine.ts"),
      "utf8",
    );
    const viteConfig = fs.readFileSync(
      path.join(repoRoot, "vite.config.ts"),
      "utf8",
    );

    expect(browserEntry).toContain('from "@viggo-games/chicken-hop-core"');
    expect(browserEntry).toMatch(
      /startChickenHopRun\(game\);\s+ui\.persistBest\(game\.best\);/,
    );
    expect(nativeAdapter).toContain('from "@viggo-games/chicken-hop-core"');
    expect(browserHtml).toContain('<script type="module" src="./game.ts"></script>');
    expect([...browserHtml.matchAll(/data-design="([^"]+)"/g)].map((match) => match[1])).toEqual(
      chickenDesignIds,
    );
    expect([...browserHtml.matchAll(/data-color="([^"]+)"/g)].map((match) => match[1])).toEqual(
      chickenColorIds,
    );
    expect(viteConfig).toContain('"games/chicken-hop/index.html"');
    expect(
      fs.existsSync(path.join(repoRoot, "public", "games", "chicken-hop", "game.js")),
    ).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, "games", "chicken-hop", "profile.ts"))).toBe(
      false,
    );
  });

  it("derives the mobile build label from Expo config", () => {
    const selector = fs.readFileSync(path.join(mobileRoot, "app", "index.tsx"), "utf8");

    expect(selector).toContain("Constants.expoConfig?.ios?.buildNumber");
    expect(selector).toContain("Constants.expoConfig?.android?.versionCode");
    expect(selector).not.toContain("BUILD 002");
  });
});
