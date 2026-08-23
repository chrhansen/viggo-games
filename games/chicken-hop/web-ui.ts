import type {
  ChickenHopGame,
  ChickenHopTimeMode,
} from "@viggo-games/chicken-hop-core";
import { lerp } from "./canvas-utils";
import {
  defaultChickenProfile,
  normalizeChickenName,
  type ChickenColor,
  type ChickenDesign,
  type ChickenProfile,
} from "./profile";

const BEST_KEY = "chicken_hop_best_v1";
const NAME_KEY = "chicken_hop_name_v1";
const LOOK_KEY = "chicken_hop_look_v1";

const requiredElement = <ElementType extends Element>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing Chicken Hop element #${id}`);
  return element as ElementType;
};

const allowedDesigns: ChickenDesign[] = ["classic", "spots", "flame", "robot"];
const allowedColors: ChickenColor[] = [
  "butter",
  "red",
  "blue",
  "green",
  "grape",
  "charcoal",
];

export class ChickenHopWebUi {
  readonly cta = requiredElement<HTMLButtonElement>("cta");
  readonly touchMode =
    Boolean(
      window.matchMedia?.("(hover: none), (pointer: coarse)").matches,
    ) || navigator.maxTouchPoints > 0;

  private best = requiredElement<HTMLElement>("best");
  private colorButtons = requiredElement<HTMLElement>("colorBtns");
  private corn = requiredElement<HTMLElement>("corn");
  private designButtons = requiredElement<HTMLElement>("designBtns");
  private heartFills = [
    requiredElement<SVGPathElement>("hpFill1"),
    requiredElement<SVGPathElement>("hpFill2"),
  ];
  private heartRects = [
    requiredElement<SVGRectElement>("hpRect1"),
    requiredElement<SVGRectElement>("hpRect2"),
  ];
  private heartSmooth: [number, number] = [100, 100];
  private nameInput = requiredElement<HTMLInputElement>("nameInput");
  private nameRandom = requiredElement<HTMLButtonElement>("nameRandom");
  private overlay = requiredElement<HTMLElement>("overlay");
  private profile: ChickenProfile = this.loadProfile();
  private score = requiredElement<HTMLElement>("score");
  private speedMode = requiredElement<HTMLElement>("speedMode");
  private subtitle = this.overlay.querySelector<HTMLElement>(".subtitle");
  private title = this.overlay.querySelector<HTMLElement>(".title");

  constructor() {
    if (this.touchMode) {
      document.body.classList.add("touch-mode");
      requiredElement("touchControls").setAttribute("aria-hidden", "false");
    }
    this.nameInput.value = this.profile.name;
    this.nameInput.addEventListener("input", () => {
      this.profile.name = normalizeChickenName(this.nameInput.value);
      this.persistProfile();
    });
    this.nameRandom.addEventListener("click", () => this.randomizeName());
    this.designButtons.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-design]",
      );
      const design = target?.dataset.design as ChickenDesign | undefined;
      if (!design || !allowedDesigns.includes(design)) return;
      this.profile.design = design;
      this.persistProfile();
      this.syncLookButtons();
    });
    this.colorButtons.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-color]",
      );
      const color = target?.dataset.color as ChickenColor | undefined;
      if (!color || !allowedColors.includes(color)) return;
      this.profile.color = color;
      this.persistProfile();
      this.syncLookButtons();
    });
    this.syncLookButtons();
  }

  static loadBest() {
    try {
      const best = Number(localStorage.getItem(BEST_KEY) ?? "0");
      return Number.isFinite(best) ? Math.max(0, Math.floor(best)) : 0;
    } catch {
      return 0;
    }
  }

  getProfile() {
    return { ...this.profile, name: normalizeChickenName(this.nameInput.value) };
  }

  persistBest(best: number) {
    try {
      localStorage.setItem(BEST_KEY, String(Math.floor(best)));
    } catch {
      // Storage is optional in private browsing and embedded contexts.
    }
  }

  setTimeMode(mode: ChickenHopTimeMode) {
    this.speedMode.textContent =
      mode === "slow" ? "Slow" : mode === "fast" ? "Fast" : "Normal";
  }

  update(game: ChickenHopGame, delta: number, idleElapsed: number) {
    this.score.textContent = String(Math.floor(game.score));
    this.best.textContent = String(Math.floor(game.best));
    this.corn.textContent = String(game.corn);
    for (let index = 0; index < 2; index += 1) {
      const target = game.mode === "ready" ? 100 : game.hearts[index];
      this.heartSmooth[index] = lerp(
        this.heartSmooth[index],
        target,
        1 - Math.pow(0.00001, delta),
      );
      this.setHeartFill(index, this.heartSmooth[index] / 100);
    }

    if (game.mode === "ready") {
      this.showOverlay(
        "Chicken Hop",
        this.touchMode ? "Tap to start" : "Press <b>Enter</b> to start",
        "Steer a brave chicken through a cozy house. Jump the clutter. Grab the corn.",
      );
      const blink = Math.sin(idleElapsed * 3) * 0.5 + 0.5;
      this.cta.style.opacity = String(lerp(0.7, 1, blink));
    } else {
      this.cta.style.opacity = "1";
    }
  }

  showPaused() {
    this.showOverlay(
      "Paused",
      this.touchMode ? "Tap to continue" : "Press P to continue",
      "Run inside the house. Jump the clutter. Grab the corn.",
    );
  }

  showGameOver(game: ChickenHopGame) {
    this.persistBest(game.best);
    this.showOverlay(
      `Bonk, ${this.profile.name}!`,
      this.touchMode ? "Tap to try again" : "Press Enter to try again",
      "Run inside the house. Jump the clutter. Grab the corn.",
    );
  }

  hideOverlay() {
    this.overlay.classList.add("hidden");
  }

  private showOverlay(title: string, cta: string, subtitle: string) {
    this.overlay.classList.remove("hidden");
    if (this.title) this.title.textContent = title;
    if (this.subtitle) this.subtitle.textContent = subtitle;
    this.cta.innerHTML = cta;
  }

  private setHeartFill(index: number, ratio: number) {
    const safeRatio = Math.max(0, Math.min(1, ratio));
    this.heartFills[index].style.opacity = String(lerp(0.1, 1, safeRatio));
    const height = Math.max(0, Math.round(24 * safeRatio));
    this.heartRects[index].setAttribute("y", String(24 - height));
    this.heartRects[index].setAttribute("height", String(height));
  }

  private randomizeName() {
    const names = [
      "Nugget",
      "Peep",
      "Waffles",
      "Biscuit",
      "Sunny",
      "Pip",
      "Popcorn",
      "Beans",
      "Doodle",
      "Sprinkles",
      "Captain Cluck",
      "Turbo Beak",
    ];
    let next = this.profile.name;
    while (next === this.profile.name && names.length > 1) {
      next = names[Math.floor(Math.random() * names.length)];
    }
    this.profile.name = next;
    this.nameInput.value = next;
    this.persistProfile();
  }

  private loadProfile(): ChickenProfile {
    const profile = { ...defaultChickenProfile };
    try {
      const name = localStorage.getItem(NAME_KEY);
      if (name) profile.name = normalizeChickenName(name);
      const rawLook = localStorage.getItem(LOOK_KEY);
      if (rawLook) {
        const look = JSON.parse(rawLook) as Partial<ChickenProfile>;
        if (look.design && allowedDesigns.includes(look.design)) {
          profile.design = look.design;
        }
        if (look.color && allowedColors.includes(look.color)) {
          profile.color = look.color;
        }
      }
    } catch {
      return profile;
    }
    return profile;
  }

  private persistProfile() {
    this.profile.name = normalizeChickenName(this.profile.name);
    try {
      localStorage.setItem(NAME_KEY, this.profile.name);
      localStorage.setItem(
        LOOK_KEY,
        JSON.stringify({
          color: this.profile.color,
          design: this.profile.design,
        }),
      );
    } catch {
      // Storage is optional in private browsing and embedded contexts.
    }
  }

  private syncLookButtons() {
    for (const button of this.designButtons.querySelectorAll<HTMLElement>(
      "[data-design]",
    )) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.design === this.profile.design ? "true" : "false",
      );
    }
    for (const button of this.colorButtons.querySelectorAll<HTMLElement>(
      "[data-color]",
    )) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.color === this.profile.color ? "true" : "false",
      );
    }
  }
}
