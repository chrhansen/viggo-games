import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { createPlayerControls } from '../../games/hunter-guy/player-controls.js';
import { createHunterGame, lookDelta, LOOK_RANGE } from '../../games/hunter-guy/core/engine.js';

const cleanup: (() => void)[] = [];

afterEach(() => {
  cleanup.splice(0).forEach(remove => remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function controls(touch = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: touch }));
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: touch ? 1 : 0 });
  cleanup.push(() => Reflect.deleteProperty(navigator, 'maxTouchPoints'));
  for (const target of [document, window]) {
    const add = target.addEventListener.bind(target);
    vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
      add(type, listener, options);
      cleanup.push(() => target.removeEventListener(type, listener, options));
    });
  }
  const element = () => document.body.appendChild(document.createElement('div'));
  const canvas = element();
  Object.assign(canvas, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
  const startBtn = element();
  const camera = new PerspectiveCamera(70, 1, 0.1, 100);
  camera.rotation.order = 'YXZ';
  const input = createPlayerControls({
    camera, renderer: { domElement: canvas }, overlay: element(), startBtn,
    statusText: element(), controlsText: element(), touchDpad: element(),
    dpadThumb: element(), fireBtn: element(), lookRangeRadians: Math.PI / 12,
    setMessage: vi.fn(), warmupAudio: vi.fn(), onUseWeapon: vi.fn(),
  });
  if (touch) startBtn.click();
  else {
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, value: canvas });
    cleanup.push(() => Reflect.deleteProperty(document, 'pointerLockElement'));
    document.dispatchEvent(new Event('pointerlockchange'));
  }
  return { camera, canvas, input };
}

function mouse(x: number, y: number) {
  const event = new MouseEvent('mousemove');
  Object.defineProperties(event, { movementX: { value: x }, movementY: { value: y } });
  document.dispatchEvent(event);
}

function pointer(canvas: HTMLElement, type: string, x: number, y: number) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, { pointerId: 1, pointerType: 'touch', clientX: x, clientY: y });
  canvas.dispatchEvent(event);
}

describe('Hunter Guy browser look input', () => {
  it.each([[0, -40, 'up'], [0, 40, 'down'], [40, 0, 'right'], [-40, 0, 'left']] as const)(
    'mouse movement (%s, %s) looks %s', (x, y) => {
      const { camera } = controls();
      mouse(x, y);
      const direction = camera.getWorldDirection(new Vector3());
      if (x) expect(Math.sign(direction.x)).toBe(Math.sign(x));
      if (y) expect(Math.sign(direction.y)).toBe(-Math.sign(y));
    },
  );

  it.each([[40, 0], [-40, 0], [0, 40], [0, -40]])(
    'touch drag (%s, %s) moves the forest with the finger', (x, y) => {
      const { camera, canvas } = controls(true);
      pointer(canvas, 'pointerdown', 100, 100);
      pointer(canvas, 'pointermove', 100 + x, 100 + y);
      camera.updateMatrixWorld(true);
      const landmark = new Vector3(0, 0, -10).project(camera);
      if (x) expect(Math.sign(landmark.x)).toBe(Math.sign(x));
      if (y) expect(Math.sign(-landmark.y)).toBe(Math.sign(y));
    },
  );

  it('reduces touch rotation to 0.21 radians per 100 pixels', () => {
    const { camera, canvas } = controls(true);
    pointer(canvas, 'pointerdown', 100, 100);
    pointer(canvas, 'pointermove', 200, 200);
    expect(Math.abs(camera.rotation.y)).toBeCloseTo(0.21);
    expect(camera.rotation.x).toBeCloseTo(0.21);
  });

  it('ignores unlocked mouse movement and ended touch gestures', () => {
    const { camera, canvas } = controls(true);
    mouse(40, 40);
    pointer(canvas, 'pointerdown', 100, 100);
    pointer(canvas, 'pointerup', 100, 100);
    pointer(canvas, 'pointermove', 140, 140);
    expect(camera.rotation.x).toBeCloseTo(0);
    expect(camera.rotation.y).toBeCloseTo(0);
  });

  it('keeps browser touch and native engine orientation equal through a drag timeline', () => {
    const { camera, canvas } = controls(true);
    const native = createHunterGame();
    native.setActive(true);
    let x = 100;
    let y = 100;
    pointer(canvas, 'pointerdown', x, y);
    for (const [dx, dy] of [[100, 100], [50, 100], [-40, -50], [-150, -1000], [0, 30]]) {
      x += dx; y += dy;
      pointer(canvas, 'pointermove', x, y);
      const delta = lookDelta(dx, dy);
      const player = native.state.player;
      native.look(player.yaw + delta.yaw, player.pitch + delta.pitch);
      expect(camera.rotation.y).toBeCloseTo(player.yaw);
      expect(camera.rotation.x).toBeCloseTo(player.pitch);
      expect(Math.abs(player.pitch)).toBeLessThanOrEqual(LOOK_RANGE);
    }
  });
});
