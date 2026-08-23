import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const mobileRoot = path.resolve(process.cwd(), "mobile", "src");

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
});
