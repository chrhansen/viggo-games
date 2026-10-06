import { readFileSync } from 'node:fs';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ts from 'typescript';
import * as THREE from 'three';
import * as gunnyCore from '../../games/gunny/core/engine.js';
import { createBurbScene } from '../../games/burb/src/scene';
import { createGunnyScene } from '../../games/gunny/src/scene.js';
import { createGunnyTouchInput } from '../../mobile/src/game/gunny/touch-input';
import { createBurbTouchInput } from '../../mobile/src/game/burb/touch-input';

type Engine = {
  state: { active: boolean; time?: number; elapsed?: number };
  step: (delta: number, input: never) => unknown;
};
type Touch = {
  input: { left: boolean };
  hold: (control: 'left', ids: string[]) => void;
};
type GL = { drawingBufferWidth: number; drawingBufferHeight: number; endFrameEXP: () => void };
type Layout = { nativeEvent: { layout: { width: number; height: number } } };
type NativeRenderer = { game: { engine: Engine; camera: THREE.PerspectiveCamera }; render: () => void };
type NativeProps = { children?: React.ReactNode; onPress?: () => void; disabled?: boolean; accessibilityLabel?: string };

// Execute native screens and adapters with real hooks, engines and scenes.
// Device ports are replaced; Expo's GL dimensions remain fixed at creation.
function loadNative<T>(path: string, modules: Record<string, unknown>): T {
  const source = readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} as T };
  const require = (id: string) => {
    if (/^(gunny|burb)\/assets\//.test(id)) return id;
    if (!(id in modules)) throw new Error(`Unmocked native port: ${id}`);
    return modules[id];
  };
  new Function('require', 'module', 'exports', compiled.outputText)(require, module, module.exports);
  return module.exports;
}

function fixture(name: 'gunny' | 'burb') {
  let dimensions = { width: 390, height: 844 };
  let engine: Engine;
  let native: NativeRenderer;
  let touch: Touch;
  let contextCreates = 0;
  let failContext = false;
  let failResize = false;
  let onContextCreate: (gl: GL) => void;
  const graphics: WebGLRenderer[] = [];
  let initialGL: GL;
  let timestamp = 1000;
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const listeners = new Set<(state: string) => void>();
  const appState = {
    currentState: 'active',
    addEventListener(_event: string, callback: (state: string) => void) {
      listeners.add(callback);
      return { remove: () => listeners.delete(callback) };
    },
  };
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const container = ({ children }: NativeProps) => React.createElement('div', null, children);
  const button = ({ children, onPress, disabled, accessibilityLabel }: NativeProps) =>
    React.createElement('button', { onClick: onPress, disabled, 'aria-label': accessibilityLabel }, children);
  class WebGLRenderer {
    capabilities = { getMaxAnisotropy: () => 4 };
    shadowMap = {};
    canvas: HTMLCanvasElement;
    aspect = 0;
    constructor({ canvas }: { canvas: HTMLCanvasElement }) { this.canvas = canvas; graphics.push(this); }
    setSize(width: number, height: number) {
      if (failResize) throw new Error('Resize unavailable');
      this.canvas.width = width; this.canvas.height = height;
    }
    render(_scene: unknown, camera: THREE.PerspectiveCamera) { this.aspect = camera.aspect; }
    dispose() {}
  }
  const deviceModules = {
    three: { ...THREE, WebGLRenderer },
    'expo-asset': { Asset: { fromModule: (source: string) => ({
      downloadAsync: async () => ({ localUri: source, width: 4, height: 4 }),
    }) } },
    'burb/scene': { createBurbScene },
    'gunny/scene': { createGunnyScene: (options: Parameters<typeof createGunnyScene>[0]) =>
      createGunnyScene({ ...options, renderer: undefined }) },
  };
  const rendererPort = loadNative<Record<string, unknown>>(`mobile/src/game/${name}/renderer.ts`, deviceModules);
  const rendererName = name === 'gunny' ? 'createNativeGunnyRenderer' : 'createNativeBurbRenderer';
  const createRenderer = (gl: GL, assets: unknown, existing?: Engine) => {
    if (failContext) throw new Error('Context unavailable');
    const create = rendererPort[rendererName] as (gl: GL, assets: unknown, existing?: Engine) => NativeRenderer;
    native = create(gl, assets, existing);
    engine = native.game.engine;
    return native;
  };
  function GLView(props: { onContextCreate: (gl: GL) => void; onLayout?: (event: Layout) => void }) {
    onContextCreate = props.onContextCreate;
    const createContext = React.useRef(props.onContextCreate);
    const layoutCallback = React.useRef(props.onLayout);
    layoutCallback.current = props.onLayout;
    const gl = React.useRef(Object.freeze({ drawingBufferWidth: Math.round(dimensions.width * 1.25),
      drawingBufferHeight: Math.round(dimensions.height * 1.25), endFrameEXP: vi.fn() }));
    const { width, height } = dimensions;
    React.useLayoutEffect(() => { layoutCallback.current?.({ nativeEvent: {
      layout: { width: width / 2.4, height: height / 2.4 },
    } }); }, [width, height]);
    React.useEffect(() => { contextCreates++; initialGL = gl.current; createContext.current(gl.current); }, []);
    return React.createElement('div', { 'data-testid': 'graphics' });
  }
  const controls = () => React.createElement('div', { 'data-testid': 'controls' });
  const modules = {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    'react-native': {
      View: container, ScrollView: container, Text: container, Pressable: button, Animated: { View: container },
      StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
      PixelRatio: { get: () => 3, getPixelSizeForLayoutSize: (size: number) => Math.round(size * 3) },
      AppState: appState, useWindowDimensions: () => dimensions,
    },
    'expo-gl': { GLView },
    'expo-router': { useFocusEffect(callback: React.EffectCallback) { React.useEffect(callback, [callback]); } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'gunny/core': gunnyCore,
    '@/constants/theme': { fonts: {} },
    '@/components/gunny/gunny-controls': { GunnyControls: controls },
    '@/components/burb/burb-controls': { BurbControls: controls },
    '@/game/gunny/touch-input': { createGunnyTouchInput: () => { touch = createGunnyTouchInput(); return touch; } },
    '@/game/burb/touch-input': { createBurbTouchInput: () => { touch = createBurbTouchInput(); return touch; } },
    [`@/game/${name}/renderer`]: { ...rendererPort, [rendererName]: createRenderer },
    '@/game/gunny/hull-warning': { useGunnyHullWarning: () => 1 },
    '@/hooks/use-game-exit': { useGameExit: () => () => {} },
    '@/hooks/use-burb-motion': { useBurbMotion: (_touch: unknown, landscape: boolean, active: boolean) => ({
      enabled: landscape && active, status: 'granted', input: { apply() {} }, recenter() {}, enable() {},
    }) },
  };
  const { default: Screen } = loadNative<{ default: React.ComponentType }>(`mobile/src/app/${name}.tsx`, modules);
  const view = render(React.createElement(Screen));
  const startLabel = name === 'gunny' ? 'LAUNCH MISSION' : 'START RIDE';
  const continueLabel = name === 'gunny' ? 'CONTINUE MISSION' : 'CONTINUE RIDE';
  const pauseLabel = name === 'gunny' ? 'Pause mission' : 'Pause ride';
  function advance() {
    act(() => {
      for (let step = 0; step < 3; step++) {
        timestamp += 16;
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(timestamp);
      }
    });
  }
  return {
    view,
    get engine() { return engine; },
    get touch() { return touch; },
    get contexts() { return contextCreates; },
    get initialGL() { return initialGL; },
    elapsed: () => engine.state.time ?? engine.state.elapsed,
    async start() {
      await waitFor(() => expect(view.getByRole('button', { name: startLabel })).toBeEnabled());
      fireEvent.click(view.getByRole('button', { name: startLabel }));
      advance();
    },
    advance,
    failResize() { failResize = true; },
    rotate(width: number, height: number) {
      dimensions = { width, height };
      view.rerender(React.createElement(Screen));
    },
    recreate(fail = false) {
      failContext = fail;
      act(() => onContextCreate({ drawingBufferWidth: Math.round(dimensions.width * 1.25),
        drawingBufferHeight: Math.round(dimensions.height * 1.25), endFrameEXP: vi.fn() }));
    },
    appState(state: string) {
      act(() => { appState.currentState = state; for (const listener of listeners) listener(state); });
    },
    pause: () => fireEvent.click(view.getByRole('button', { name: pauseLabel })),
    resume: () => fireEvent.click(view.getByRole('button', { name: continueLabel })),
    expectPlaying() {
      expect(engine.state.active).toBe(true);
      expect(view.getByTestId('controls')).toBeInTheDocument();
      expect(view.queryByText(continueLabel)).not.toBeInTheDocument();
    },
    expectPaused() {
      expect(engine.state.active).toBe(false);
      expect(view.getByRole('button', { name: continueLabel })).toBeInTheDocument();
      expect(view.queryByTestId('controls')).not.toBeInTheDocument();
    },
    expectSize(width: number, height: number) {
      const bufferWidth = Math.round(width * 1.25), bufferHeight = Math.round(height * 1.25);
      const current = graphics[graphics.length - 1];
      expect(current.canvas.width).toBe(bufferWidth);
      expect(current.canvas.height).toBe(bufferHeight);
      expect(native.game.camera.aspect).toBe(bufferWidth / bufferHeight);
      expect(current.aspect).toBe(bufferWidth / bufferHeight);
    },
  };
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe.each(['gunny', 'burb'] as const)('%s mobile rotation', name => {
  it('keeps playing portrait → landscape → portrait without replacing the engine or GL view', async () => {
    const game = fixture(name);
    await game.start();
    const engine = game.engine;
    for (const [width, height] of [[844, 390], [390, 844]]) {
      const elapsed = game.elapsed();
      game.touch.hold('left', ['held-before-rotation']);
      game.rotate(width, height);
      game.expectPlaying();
      expect(game.touch.input.left).toBe(false);
      expect(game.engine).toBe(engine);
      expect(game.contexts).toBe(1);
      game.advance();
      expect(game.elapsed()).toBeGreaterThan(elapsed);
      game.expectSize(width, height);
      expect(game.initialGL.drawingBufferWidth).toBe(Math.round(390 * 1.25));
      expect(game.initialGL.drawingBufferHeight).toBe(Math.round(844 * 1.25));
    }
  });

  it('keeps a deliberate pause through rotation and graphics recreation until Continue', async () => {
    const game = fixture(name);
    await game.start();
    game.pause();
    const elapsed = game.elapsed();
    game.rotate(844, 390);
    game.recreate();
    game.advance();
    game.expectPaused();
    expect(game.elapsed()).toBe(elapsed);
    game.resume();
    game.advance();
    game.expectPlaying();
    expect(game.elapsed()).toBeGreaterThan(elapsed);
  });

  it('preserves a running game when the native graphics context is recreated', async () => {
    const game = fixture(name);
    await game.start();
    const engine = game.engine;
    const elapsed = game.elapsed();
    game.recreate();
    game.expectPlaying();
    expect(game.engine).toBe(engine);
    game.advance();
    expect(game.elapsed()).toBeGreaterThan(elapsed);
  });

  it('still pauses in the background and requires Continue after rotating there', async () => {
    const game = fixture(name);
    await game.start();
    const elapsed = game.elapsed();
    game.appState('background');
    game.rotate(844, 390);
    game.recreate();
    game.advance();
    game.appState('active');
    game.advance();
    game.expectPaused();
    expect(game.elapsed()).toBe(elapsed);
    game.resume();
    game.advance();
    game.expectPlaying();
  });

  it('pauses and shows the device error if graphics recreation fails', async () => {
    const game = fixture(name);
    await game.start();
    const elapsed = game.elapsed();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game.recreate(true);
    game.advance();
    expect(game.engine.state.active).toBe(false);
    expect(game.elapsed()).toBe(elapsed);
    expect(game.view.getByText(/This device could not open/)).toBeInTheDocument();
    expect(game.view.queryByTestId('controls')).not.toBeInTheDocument();
  });

  it('pauses and shows the graphics error if resizing fails', async () => {
    const game = fixture(name);
    await game.start();
    const elapsed = game.elapsed();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game.failResize();
    game.rotate(844, 390);
    game.advance();
    expect(game.engine.state.active).toBe(false);
    expect(game.elapsed()).toBe(elapsed);
    expect(game.view.getByText(/Graphics stopped/)).toBeInTheDocument();
    expect(game.view.queryByTestId('controls')).not.toBeInTheDocument();
  });
});
