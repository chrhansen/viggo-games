import { readFileSync } from 'node:fs';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ts from 'typescript';
import * as THREE from 'three';
import { TorpedoGame } from '../../games/torpedo/src/game/TorpedoGame.js';
import { ROOMS } from '../../games/torpedo/src/game/rooms.js';
import * as bossProgress from '../../games/torpedo/src/game/bossProgress.js';
import { createTorpedoTouchInput } from '../../mobile/src/game/torpedo/touch-input';

type GL = { drawingBufferWidth: number; drawingBufferHeight: number; endFrameEXP: () => void };
type NativeProps = { children?: React.ReactNode; onPress?: () => void; disabled?: boolean; accessibilityLabel?: string };
function loadNative<T>(path: string, modules: Record<string, unknown>): T {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)((name: string) => {
    if (name in modules) return modules[name];
    if (name.startsWith('torpedo/assets/')) return name;
    throw new Error(`Unmocked native module: ${name}`);
  }, module, module.exports);
  return module.exports as T;
}
function fixture(slot: { value: string | null } = { value: null }) {
  let dimensions = { width: 390, height: 844 };
  let game: TorpedoGame;
  let touch: ReturnType<typeof createTorpedoTouchInput>;
  let contextCreates = 0, timestamp = 1000, nextFrame = 0;
  let failContext = false, failResize = false;
  let onContextCreate: (gl: GL) => void;
  const frames = new Map<number, FrameRequestCallback>();
  const listeners = new Set<(state: string) => void>();
  const rendered: { aspect: number; width: number; height: number }[] = [];
  const appState = {
    currentState: 'active',
    addEventListener(_event: string, callback: (state: string) => void) {
      listeners.add(callback); return { remove: () => listeners.delete(callback) };
    },
  };
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const container = ({ children }: NativeProps) => React.createElement('div', null, children);
  const button = ({ children, onPress, disabled, accessibilityLabel }: NativeProps) =>
    React.createElement('button', { onClick: onPress, disabled, 'aria-label': accessibilityLabel }, children);
  class WebGLRenderer {
    canvas: HTMLCanvasElement;
    constructor({ canvas }: { canvas: HTMLCanvasElement }) { if (failContext) throw Error('Context lost'); this.canvas = canvas; }
    setSize(width: number, height: number) {
      if (failResize) throw Error('Cannot resize'); this.canvas.width = width; this.canvas.height = height;
    }
    render(_scene: unknown, camera: THREE.PerspectiveCamera) { rendered.push({ aspect: camera.aspect, width: this.canvas.width, height: this.canvas.height }); }
    dispose() {}
  }
  function GLView(props: { onContextCreate: (gl: GL) => void; onLayout: (event: unknown) => void }) {
    onContextCreate = props.onContextCreate;
    const initialContext = React.useRef(props.onContextCreate);
    const layout = React.useRef(props.onLayout); layout.current = props.onLayout;
    const { width, height } = dimensions;
    React.useLayoutEffect(() => { layout.current({ nativeEvent: { layout: { width: width / 2.4, height: height / 2.4 } } }); }, [width, height]);
    React.useEffect(() => { contextCreates++; initialContext.current(Object.freeze({ drawingBufferWidth: 488, drawingBufferHeight: 1055, endFrameEXP: vi.fn() })); }, []);
    return React.createElement('div', { 'data-testid': 'graphics' });
  }
  function captureGame(value: TorpedoGame) { game = value; }
  const modules: Record<string, unknown> = {
    react: React, 'react/jsx-runtime': jsxRuntime,
    'react-native': {
      View: container, ScrollView: container, Text: container, Pressable: button,
      StyleSheet: { create: (style: unknown) => style, absoluteFill: {} },
      PixelRatio: { get: () => 3, getPixelSizeForLayoutSize: (size: number) => Math.round(size * 3) },
      AppState: appState, useWindowDimensions: () => dimensions,
    },
    three: { ...THREE, WebGLRenderer },
    'expo-gl': { GLView }, 'expo-image': { Image: () => null },
    'expo-router': { useFocusEffect(callback: React.EffectCallback) { React.useEffect(callback, [callback]); } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'torpedo/game': { TorpedoGame: class extends TorpedoGame {
      constructor(callbacks: ConstructorParameters<typeof TorpedoGame>[0]) { super(callbacks); captureGame(this); }
    } },
    'torpedo/boss-progress': bossProgress,
    'expo-file-system': { Paths: { document: 'documents' }, File: class {
      get exists() { return slot.value !== null; }
      textSync() { return slot.value; }
      write(value: string) { slot.value = value; }
    } },
    'torpedo/rooms': { ROOMS }, '@/constants/theme': { fonts: {} },
    '@/game/torpedo/touch-input': { createTorpedoTouchInput: () => { touch = createTorpedoTouchInput(); return touch; } },
    '@/components/torpedo/torpedo-controls': { TorpedoControls: () => React.createElement('div', { 'data-testid': 'controls' }) },
    '@/hooks/use-game-exit': { useGameExit: (_title: string, pause: () => () => void) => () => { pause()(); } },
  };
  modules['@/game/torpedo/boss-progress'] = loadNative('mobile/src/game/torpedo/boss-progress.ts', modules);
  modules['@/game/torpedo/renderer'] = loadNative('mobile/src/game/torpedo/renderer.ts', modules);
  modules['@/hooks/use-torpedo'] = loadNative('mobile/src/hooks/use-torpedo.ts', modules);
  modules['@/components/torpedo/torpedo-rooms'] = loadNative('mobile/src/components/torpedo/torpedo-rooms.tsx', modules);
  const { default: Screen } = loadNative<{ default: React.ComponentType }>('mobile/src/app/torpedo.tsx', modules);
  const view = render(React.createElement(Screen));
  const click = (name: string) => fireEvent.click(view.getByRole('button', { name }));
  const advance = () => act(() => { for (let i = 0; i < 3; i++) {
    timestamp += 16; const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback(timestamp);
  } });
  return {
    view, click, advance, get game() { return game; }, get touch() { return touch; },
    get contexts() { return contextCreates; }, get frameCount() { return frames.size; }, get renderCount() { return rendered.length; },
    start() { click('START PATROL'); advance(); },
    rotate(width: number, height: number) { dimensions = { width, height }; view.rerender(React.createElement(Screen)); },
    recreate(fail = false) { failContext = fail; act(() => onContextCreate({ drawingBufferWidth: 1055, drawingBufferHeight: 488, endFrameEXP: vi.fn() })); },
    failResize() { failResize = true; },
    appState(state: string) { act(() => { appState.currentState = state; for (const listener of listeners) listener(state); }); },
    expectSize(width: number, height: number) {
      expect(rendered.at(-1)).toEqual({ width: Math.round(width * 1.25), height: Math.round(height * 1.25), aspect: Math.round(width * 1.25) / Math.round(height * 1.25) });
    },
  };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Torpedo native screen', () => {
  it('keeps only the latest boss count across exit, resume, and a fresh patrol', () => {
    const slot = { value: '2' };
    const menu = fixture(slot);
    expect(menu.view.getByText(/Your last patrol sank 2 bosses/)).toBeInTheDocument();
    menu.view.unmount();
    expect(slot.value).toBe('2');

    const resumed = fixture(slot);
    resumed.click('RESUME BOSS COUNT');
    expect(resumed.game.getSnapshot()).toMatchObject({ status: 'Boss 2/5', hull: 160, score: 0 });
    resumed.game.bossLoop.regularKills = resumed.game.bossLoop.regularKillsNeeded();
    resumed.game.bossLoop.update(0);
    const boss = resumed.game.bossLoop.boss!;
    for (let hits = boss.health; hits > 0; hits--) resumed.game.bossLoop.hitBoss({ mesh: boss.mesh });
    resumed.game.damagePlayer(12);
    expect(resumed.game.getSnapshot()).toMatchObject({ bossesDefeated: 3, score: 500, hull: 148 });
    resumed.view.unmount();
    expect(slot.value).toBe('3');

    const next = fixture(slot);
    next.click('RESUME BOSS COUNT');
    expect(next.game.getSnapshot()).toMatchObject({ status: 'Boss 3/5', hull: 160, score: 0 });
    expect(next.game.bossLoop.waitingForPickup).toBe(false);
    next.view.unmount();

    const fresh = fixture(slot);
    fresh.click('START FRESH');
    expect(fresh.game.getSnapshot()).toMatchObject({ status: 'Boss 0/5', hull: 160, score: 0 });
    fresh.view.unmount();
    expect(slot.value).toBe('0');
    const reopened = fixture(slot);
    expect(reopened.view.getByText(/Your last patrol sank 0 bosses/)).toBeInTheDocument();
  });

  it('resumes a completed boss ladder at level two and offers both choices after a hull breach', () => {
    const app = fixture({ value: '5' });
    app.click('RESUME BOSS COUNT');
    expect(app.game.getSnapshot()).toMatchObject({ status: 'Level 2', score: 0, hull: 160 });
    app.game.damagePlayer(160); app.advance();
    app.click('START FRESH');
    expect(app.game.getSnapshot()).toMatchObject({ status: 'Boss 0/5', score: 0, hull: 160, gameOver: false });
  });

  it.each([null, '', 'null', '-1', '6', '1.5', '{"score":900}'])('offers a first patrol for missing or invalid storage (%s)', value => {
    const app = fixture({ value });
    expect(app.view.getByRole('button', { name: 'START PATROL' })).toBeEnabled();
    expect(app.view.queryByRole('button', { name: 'RESUME BOSS COUNT' })).not.toBeInTheDocument();
  });

  it('keeps its patrol and GL surface through portrait/landscape changes, clearing held controls', () => {
    const app = fixture(); app.start(); const game = app.game;
    for (const [width, height] of [[844, 390], [390, 844]]) {
      const z = game.player.position.z; app.touch.hold('left', ['left']);
      app.rotate(width, height); expect(app.touch.held('left')).toBe(false);
      app.advance(); expect(app.game).toBe(game); expect(game.active).toBe(true);
      expect(game.player.position.z).toBeLessThan(z); expect(app.contexts).toBe(1); app.expectSize(width, height);
    }
  });

  it('preserves activity through graphics recreation but holds deliberate/background pauses', () => {
    const app = fixture(); app.start(); const game = app.game;
    app.recreate(); app.advance(); expect(app.game).toBe(game); expect(game.active).toBe(true);
    app.click('Pause patrol'); const z = game.player.position.z;
    app.rotate(844, 390); app.recreate(); app.advance(); expect(game.active).toBe(false);
    expect(game.player.position.z).toBe(z); app.click('CONTINUE PATROL'); app.advance();
    expect(game.active).toBe(true); app.appState('background'); const paused = game.player.position.z;
    app.recreate(); app.advance(); app.appState('active'); app.advance();
    expect(game.player.position.z).toBe(paused); expect(game.active).toBe(false);
    app.click('CONTINUE PATROL'); app.advance(); expect(game.active).toBe(true);
  });

  it('does not spend GPU frames on the start card or paused/room screens, but redraws after rotation', () => {
    const app = fixture(); app.advance(); const initial = app.renderCount;
    app.advance(); expect(app.renderCount).toBe(initial);
    app.start(); app.click('Pause patrol'); app.advance(); const paused = app.renderCount;
    app.advance(); expect(app.renderCount).toBe(paused);
    app.rotate(844, 390); app.advance(); expect(app.renderCount).toBe(paused + 1); app.expectSize(844, 390);
    app.click('CONTINUE PATROL'); app.advance(); app.click('Visit submarine rooms'); app.advance();
    const inRoom = app.renderCount; app.advance(); expect(app.renderCount).toBe(inRoom);
  });

  it('visits every room, applies the shared actions, and returns to the selected window', () => {
    const app = fixture(); app.start(); app.game.player.hull = 80; app.game.player.engineBroken = true;
    app.click('Visit submarine rooms'); const z = app.game.player.position.z;
    app.advance(); expect(app.game.active).toBe(false); expect(app.game.player.position.z).toBe(z);
    for (const room of ROOMS) { app.click(room.title); app.click(room.actionLabel.toUpperCase()); }
    expect(app.game.player.hull).toBe(92); expect(app.game.player.engineBroken).toBe(false);
    app.click('Sonar Room'); app.click('RETURN TO PATROL →'); app.advance();
    expect(app.game.active).toBe(true); expect(app.game.view).toBe('port');
    app.click('scope view'); app.advance(); expect(app.game.camera.fov).toBe(34);
  });

  it('pauses on graphics failures and releases all animation/resources on unmount', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = fixture(); app.start(); app.failResize(); app.rotate(844, 390); app.advance();
    expect(app.game.active).toBe(false); expect(app.view.getByText(/Graphics stopped/)).toBeInTheDocument();
    expect(app.view.queryByTestId('controls')).not.toBeInTheDocument();
    app.view.unmount(); expect(app.frameCount).toBe(0); expect(app.game.scene.children).toHaveLength(0);
  });

  it('clears held inputs on room entry, view change, background, and canceled exit', () => {
    const app = fixture(); app.start();
    for (const trigger of [
      () => app.click('scope view'),
      () => { app.click('Visit submarine rooms'); app.click('RETURN TO PATROL →'); },
      () => { app.appState('background'); app.appState('active'); app.click('CONTINUE PATROL'); },
      () => app.click('Exit Torpedo'),
    ]) {
      app.touch.hold('fire', ['fire']); app.touch.hold('left', ['left']); trigger();
      expect(app.touch.held('fire')).toBe(false); expect(app.touch.held('left')).toBe(false);
      expect(app.game.active).toBe(true);
    }
  });

  it('exposes graphics errors even while the room panel is open', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = fixture(); app.start(); app.click('Visit submarine rooms');
    app.recreate(true); app.advance();
    expect(app.view.getByText(/This device could not open the ocean/)).toBeInTheDocument();
    expect(app.view.queryByRole('button', { name: 'RETURN TO PATROL →' })).not.toBeInTheDocument();
    expect(app.view.getByRole('button', { name: 'Exit Torpedo' })).toBeEnabled();
  });

  it('shows a recoverable error when a replacement GL context cannot initialize', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = fixture(); app.start(); app.recreate(true); app.advance();
    expect(app.game.active).toBe(false); expect(app.view.getByText(/This device could not open the ocean/)).toBeInTheDocument();
    expect(app.view.queryByTestId('controls')).not.toBeInTheDocument();
  });
});
