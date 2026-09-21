import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { gamePreviews } from "../../mobile/src/data/games";

const mobileRoot = path.resolve(process.cwd(), "mobile");
const appConfig = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "app.json"), "utf8"),
).expo;
const packageConfig = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "package.json"), "utf8"),
);

describe("mobile app identity", () => {
  it("ships Viggo Games as a phone-only native app on iOS and Android", () => {
    expect(appConfig).toMatchObject({
      name: "Viggo Games",
      platforms: ["ios", "android"],
      ios: {
        bundleIdentifier: "games.viggo",
        supportsTablet: false,
      },
      android: {
        package: "games.viggo",
      },
    });
  });

  it("uses the custom icon and splash assets", () => {
    const splashPlugin = appConfig.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );

    expect(appConfig.icon).toBe("./assets/app-icon.png");
    expect(appConfig.android.adaptiveIcon).toMatchObject({
      backgroundColor: "#000000",
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/monochrome-icon.png",
    });
    expect(splashPlugin?.[1]).toMatchObject({
      backgroundColor: "#000000",
      image: "./assets/splash-icon.png",
    });

    for (const asset of [
      "app-icon.png",
      "adaptive-icon.png",
      "monochrome-icon.png",
      "splash-icon.png",
    ]) {
      expect(fs.existsSync(path.join(mobileRoot, "assets", asset))).toBe(true);
    }
  });
});

describe("mobile child-safety constraints", () => {
  it("does not link the Expo WebView module", () => {
    expect(packageConfig.expo?.autolinking?.exclude).toContain("@expo/dom-webview");
    expect(packageConfig.dependencies).not.toHaveProperty("react-native-webview");
  });

  it("blocks unnecessary Android permissions", () => {
    expect(appConfig.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.VIBRATE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ]),
    );
  });
});

describe("mobile game selector", () => {
  it("presents Chicken Hop and Hunter Guy as playable native missions", () => {
    expect(gamePreviews[0]).toMatchObject({
      id: "chicken-hop",
      level: "01",
      title: "Chicken Hop",
      status: "ready",
    });
    expect(gamePreviews.filter((game) => game.status === "ready").map(game => game.route)).toEqual(["/chicken-hop", "/hunter-guy"]);
    expect(gamePreviews.slice(2).every((game) => game.status === "locked")).toBe(true);
  });

  it("keeps selector ids and level numbers unique", () => {
    const ids = gamePreviews.map((game) => game.id);
    const levels = gamePreviews.map((game) => game.level);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(levels).size).toBe(levels.length);
  });
});
