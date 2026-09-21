import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { GunnyGame } from "../src/game.js";

class HudGame extends GunnyGame {
  setupRenderer() { this.renderer = { setAnimationLoop() {} }; }
  setupScene() {}
  resetMission() {
    this.started = false;
    this.finished = false;
    this.state = { health: 100, score: 0, kills: 0, distance: 0 };
  }
}

function fixture(t, mobile = true) {
  const { window } = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { pretendToBeVisual: true });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = window;
  globalThis.document = window.document;
  window.matchMedia = () => ({ matches: mobile });
  t.mock.method(window.document, "hasFocus", () => true);
  t.after(() => {
    window.close();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  const dom = Object.fromEntries([...window.document.querySelectorAll('[id]')].map(el => [el.id, el]));
  const game = new HudGame(dom);
  t.after(() => clearTimeout(game.missionCardTimer));
  return { game, window, dom };
}

test('mobile mission help dismisses five seconds after launch, never before launch', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { game, dom } = fixture(t);
  t.mock.timers.tick(10000);
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), false);
  game.startMission();
  t.mock.timers.tick(4999);
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), false);
  t.mock.timers.tick(1);
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), true);
});

test('desktop help stays visible and the dismiss button still works', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { game, dom } = fixture(t, false);
  game.startMission();
  t.mock.timers.tick(6000);
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), false);
  dom.dismissTitleCard.click();
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), true);
});

test('a restart replaces the dismissal timer and manual dismissal remains effective', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { game, dom } = fixture(t);
  game.startMission();
  t.mock.timers.tick(4000);
  game.startMission();
  t.mock.timers.tick(1000);
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), false);
  dom.dismissTitleCard.click();
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), true);
  t.mock.timers.tick(5000);
  assert.equal(game.missionCardTimer, null);
  game.startMission();
  assert.equal(dom.missionCard.classList.contains('hud__block--hidden'), true);
});

test('the entire hull stat warns at the displayed 10%, including fractional blast damage', t => {
  const { game, dom } = fixture(t);
  game.started = true;
  game.state.health = 10.4;
  const update = t.mock.method(game.hullWarning, 'update', () => {});
  game.updateHud();
  assert.equal(dom.healthValue.textContent, '10%');
  assert.equal(dom.healthValue.closest('.stat').classList.contains('stat--critical'), true);
  assert.equal(update.mock.calls.at(-1).arguments[0], true);
  game.state.health = 10.6;
  game.updateHud();
  assert.equal(dom.healthValue.closest('.stat').classList.contains('stat--critical'), false);
  game.state.health = 10;
  game.finished = true;
  game.updateHud();
  assert.equal(dom.healthValue.closest('.stat').classList.contains('stat--critical'), false);
  assert.equal(update.mock.calls.at(-1).arguments[0], false);
});
