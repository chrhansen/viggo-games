import { describe, expect, it, vi } from "vitest";

import type { ChickenHopMode } from "@viggo-games/chicken-hop-core";
import { ChickenHopWebInput } from "../../games/chicken-hop/web-input";

function dispatchPointer(target: EventTarget, type: string, pointerId: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  target.dispatchEvent(event);
}

describe("Chicken Hop browser input adapter", () => {
  it("maps keyboard and multi-touch controls into shared engine actions", () => {
    document.body.innerHTML = `
      <button id="cta"></button>
      <button id="touchPause"></button>
      <button id="touchRestart"></button>
      <button id="left" data-touch="left"></button>
      <button id="right" data-touch="right"></button>
      <button id="jump" data-touch="jump"></button>
      <button id="down" data-touch="down"></button>
    `;

    let mode: ChickenHopMode = "playing";
    const callbacks = {
      ensureAudio: vi.fn(),
      getMode: () => mode,
      onPause: vi.fn(),
      onRestart: vi.fn(),
      onStart: vi.fn(),
      onTimeMode: vi.fn(),
    };
    const input = new ChickenHopWebInput(true, callbacks);

    for (const key of ["a", " ", "s"]) {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }),
      );
    }
    expect(input.getInput()).toEqual({
      down: true,
      jump: true,
      left: true,
      right: false,
    });

    for (const key of ["a", " ", "s"]) {
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    }
    expect(input.getInput()).toEqual({
      down: false,
      jump: false,
      left: false,
      right: false,
    });

    for (const key of ["1", "2", "3", "p", "r"]) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    }
    expect(callbacks.onTimeMode.mock.calls.map(([value]) => value)).toEqual([
      "slow",
      "normal",
      "fast",
    ]);
    expect(callbacks.onPause).toHaveBeenCalledTimes(1);
    expect(callbacks.onRestart).toHaveBeenCalledTimes(1);

    mode = "ready";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    document.getElementById("cta")?.click();
    expect(callbacks.onStart).toHaveBeenCalledTimes(2);

    mode = "paused";
    document.getElementById("cta")?.click();
    expect(callbacks.onPause).toHaveBeenCalledTimes(2);

    mode = "playing";
    const left = document.getElementById("left")!;
    const right = document.getElementById("right")!;
    dispatchPointer(left, "pointerdown", 10);
    dispatchPointer(left, "pointerdown", 11);
    expect(input.getInput().left).toBe(true);
    expect(left).toHaveClass("active");

    dispatchPointer(left, "pointerup", 10);
    expect(input.getInput().left).toBe(true);
    dispatchPointer(left, "pointerup", 11);
    expect(input.getInput().left).toBe(false);

    dispatchPointer(left, "pointerdown", 12);
    dispatchPointer(right, "pointerdown", 12);
    expect(input.getInput()).toMatchObject({ left: false, right: true });
    dispatchPointer(window, "pointercancel", 12);
    expect(input.getInput().right).toBe(false);

    dispatchPointer(document.getElementById("touchPause")!, "pointerdown", 20);
    dispatchPointer(document.getElementById("touchRestart")!, "pointerdown", 21);
    expect(callbacks.onPause).toHaveBeenCalledTimes(3);
    expect(callbacks.onRestart).toHaveBeenCalledTimes(2);

    dispatchPointer(left, "pointerdown", 30);
    window.dispatchEvent(new Event("blur"));
    expect(input.getInput().left).toBe(false);
    expect(left).not.toHaveClass("active");
    expect(callbacks.ensureAudio).toHaveBeenCalled();
  });
});
