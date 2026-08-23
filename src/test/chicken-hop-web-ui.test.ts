import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChickenHopGame,
  startChickenHopRun,
} from "@viggo-games/chicken-hop-core";
import { ChickenHopWebUi } from "../../games/chicken-hop/web-ui";

const fixture = `
  <button id="cta"></button>
  <span id="best"></span>
  <span id="corn"></span>
  <span id="score"></span>
  <span id="speedMode"></span>
  <div id="colorBtns">
    <button data-color="butter"></button>
    <button data-color="blue"></button>
  </div>
  <div id="designBtns">
    <button data-design="classic"></button>
    <button data-design="robot"></button>
  </div>
  <svg>
    <path id="hpFill1"></path>
    <path id="hpFill2"></path>
    <rect id="hpRect1"></rect>
    <rect id="hpRect2"></rect>
  </svg>
  <input id="nameInput" />
  <button id="nameRandom"></button>
  <div id="overlay"><h1 class="title"></h1><p class="subtitle"></p></div>
  <div id="touchControls" aria-hidden="true"></div>
`;

describe("Chicken Hop browser UI adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = fixture;
    document.body.className = "";
    localStorage.clear();
  });

  it("loads, validates, changes, and persists the browser chicken profile", () => {
    localStorage.setItem("chicken_hop_name_v1", "  Captain    Cluck  ");
    localStorage.setItem(
      "chicken_hop_look_v1",
      JSON.stringify({ color: "blue", design: "robot" }),
    );
    localStorage.setItem("chicken_hop_best_v1", "12.9");

    expect(ChickenHopWebUi.loadBest()).toBe(12);
    const ui = new ChickenHopWebUi();
    expect(ui.getProfile()).toEqual({
      color: "blue",
      design: "robot",
      name: "Captain Cluck",
    });

    document.querySelector<HTMLElement>("[data-design='classic']")?.click();
    document.querySelector<HTMLElement>("[data-color='butter']")?.click();
    const nameInput = document.getElementById("nameInput") as HTMLInputElement;
    nameInput.value = "  Sunny   Side  ";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(ui.getProfile()).toEqual({
      color: "butter",
      design: "classic",
      name: "Sunny Side",
    });
    expect(localStorage.getItem("chicken_hop_name_v1")).toBe("Sunny Side");
    expect(JSON.parse(localStorage.getItem("chicken_hop_look_v1") ?? "{}"))
      .toEqual({ color: "butter", design: "classic" });
    expect(
      document.querySelector("[data-design='classic']"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("[data-color='butter']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("projects shared state into HUD, pause, and game-over browser UI", () => {
    const ui = new ChickenHopWebUi();
    const game = createChickenHopGame({ best: 14, seed: 42 });

    ui.update(game, 1 / 60, 0.5);
    expect(document.querySelector(".title")).toHaveTextContent("Chicken Hop");
    expect(document.getElementById("cta")?.innerHTML).toContain("Enter");

    startChickenHopRun(game);
    game.score = 123.8;
    game.corn = 4;
    game.hearts = [50, 0];
    ui.update(game, 1 / 60, 1);
    expect(document.getElementById("score")).toHaveTextContent("123");
    expect(document.getElementById("best")).toHaveTextContent("14");
    expect(document.getElementById("corn")).toHaveTextContent("4");
    expect(document.getElementById("hpRect1")).toHaveAttribute("height", "22");

    ui.update(game, 1, 1);
    expect(document.getElementById("hpRect1")).toHaveAttribute("height", "12");

    ui.setTimeMode("slow");
    expect(document.getElementById("speedMode")).toHaveTextContent("Slow");
    ui.setTimeMode("fast");
    expect(document.getElementById("speedMode")).toHaveTextContent("Fast");
    ui.setTimeMode("normal");
    expect(document.getElementById("speedMode")).toHaveTextContent("Normal");

    ui.showPaused();
    expect(document.querySelector(".title")).toHaveTextContent("Paused");
    game.best = 321;
    ui.showGameOver(game);
    expect(document.querySelector(".title")).toHaveTextContent("Bonk, Nugget!");
    expect(localStorage.getItem("chicken_hop_best_v1")).toBe("321");
    ui.hideOverlay();
    expect(document.getElementById("overlay")).toHaveClass("hidden");
  });

  it("falls back safely when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    expect(ChickenHopWebUi.loadBest()).toBe(0);
    const ui = new ChickenHopWebUi();
    expect(ui.getProfile()).toEqual({
      color: "butter",
      design: "classic",
      name: "Nugget",
    });

    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full");
    });
    expect(() => ui.persistBest(123)).not.toThrow();

    const nameInput = document.getElementById("nameInput") as HTMLInputElement;
    nameInput.value = "Peep";
    expect(() => {
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    }).not.toThrow();
  });

  it("uses the shared random-name behavior", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const ui = new ChickenHopWebUi();

    document.getElementById("nameRandom")?.click();

    expect(ui.getProfile().name).toBe("Peep");
    expect(localStorage.getItem("chicken_hop_name_v1")).toBe("Peep");
  });
});
