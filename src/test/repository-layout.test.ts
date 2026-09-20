import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

describe("self-contained game repository", () => {
  it("keeps every registered game entrypoint and README under games", () => {
    const games = readJson("src/data/games.json");
    for (const game of games) {
      expect(existsSync(resolve(root, "games", game.id, "index.html"))).toBe(true);
      expect(existsSync(resolve(root, "games", game.id, "README.md"))).toBe(true);
      const html = readFileSync(resolve(root, "games", game.id, "index.html"), "utf8");
      for (const [, source] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
        expect(source.startsWith("/")).toBe(false);
        expect(existsSync(resolve(root, "games", game.id, source))).toBe(true);
      }
      expect(html).not.toContain('type="importmap"');
    }
    expect(readdirSync(resolve(root, "games")).sort()).toEqual(games.map((game: { id: string }) => game.id).sort());
    expect(existsSync(resolve(root, ".gitmodules"))).toBe(false);
    expect(existsSync(resolve(root, "public/games"))).toBe(false);
  });

  it("resolves every local npm dependency inside this checkout", () => {
    const manifest = readJson("package.json");
    for (const folder of [".", "mobile", ...manifest.workspaces]) {
      const pkg = readJson(`${folder}/package.json`);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const value of Object.values(dependencies)) {
        if (typeof value !== "string" || !value.startsWith("file:")) continue;
        const target = realpathSync(resolve(root, folder, value.slice(5)));
        const local = relative(realpathSync(root), target);
        expect(local.startsWith("..")).toBe(false);
        expect(isAbsolute(local)).toBe(false);
      }
    }
  });
});
