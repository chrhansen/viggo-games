import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, PixelRatio, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { TorpedoGame, type TorpedoView } from 'torpedo/game';
import { createNativeTorpedoRenderer, type NativeTorpedoRenderer } from '@/game/torpedo/renderer';
import { createTorpedoTouchInput } from '@/game/torpedo/touch-input';

export function useTorpedo() {
  const { width, height } = useWindowDimensions();
  const [game] = useState(() => new TorpedoGame());
  const [touch] = useState(createTorpedoTouchInput);
  const [hud, setHud] = useState(() => game.getSnapshot());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState(false);
  const alive = useRef(true);
  const frame = useRef(0);
  const runtime = useRef<NativeTorpedoRenderer | null>(null);
  const surfaceSize = useRef<{ width: number; height: number } | null>(null);
  const sync = useCallback(() => setHud(game.getSnapshot()), [game]);
  const pause = useCallback(() => { game.pause(); touch.reset(); sync(); }, [game, sync, touch]);
  useFocusEffect(useCallback(() => pause, [pause]));
  useLayoutEffect(() => { touch.reset(); game.clearKeys(); }, [width, height, game, touch]);
  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
    return () => {
      alive.current = false; subscription.remove(); cancelAnimationFrame(frame.current);
      touch.reset(); runtime.current?.dispose(); runtime.current = null; game.dispose();
    };
  }, [game, pause, touch]);

  function onSurfaceLayout({ nativeEvent: { layout } }: LayoutChangeEvent) {
    if (layout.width <= 0 || layout.height <= 0) return;
    surfaceSize.current = {
      width: PixelRatio.getPixelSizeForLayoutSize(layout.width),
      height: PixelRatio.getPixelSizeForLayoutSize(layout.height),
    };
  }
  function onContextCreate(gl: ExpoWebGLRenderingContext) {
    if (!alive.current) return;
    cancelAnimationFrame(frame.current);
    runtime.current?.dispose(); runtime.current = null;
    try {
      const renderer = createNativeTorpedoRenderer(gl, game);
      runtime.current = renderer;
      if (surfaceSize.current) renderer.resize(surfaceSize.current.width, surfaceSize.current.height);
      setReady(true); setError('');
      let previous = 0, lastHud = '', lastFrame = '';
      function tick(time: number) {
        if (!alive.current || runtime.current !== renderer) return;
        try {
          if (AppState.currentState === 'active') {
            const delta = previous ? (time - previous) / 1000 : 0;
            previous = game.active ? time : 0;
            if (surfaceSize.current) renderer.resize(surfaceSize.current.width, surfaceSize.current.height);
            const wasActive = game.active;
            if (wasActive) touch.apply(game);
            game.step(delta);
            const renderKey = `${game.view}:${surfaceSize.current?.width}:${surfaceSize.current?.height}`;
            if (wasActive || renderKey !== lastFrame) { renderer.render(); lastFrame = renderKey; }
            const state = game.getSnapshot(), key = JSON.stringify(state);
            if (key !== lastHud) { lastHud = key; setHud(state); }
            if (state.gameOver) touch.reset();
          } else previous = 0;
          frame.current = requestAnimationFrame(tick);
        } catch (error) {
          console.error('[Torpedo frame]', error); pause(); setRooms(false);
          setError('Graphics stopped. Return to the arcade and reopen Torpedo.');
        }
      }
      frame.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error('[Torpedo graphics]', error); pause(); setRooms(false); setReady(false);
      setError('This device could not open the ocean. Return to the arcade and try again.');
    }
  }
  const start = useCallback(() => {
    if (!ready || error || AppState.currentState !== 'active') return;
    touch.reset(); game.clearKeys();
    if (game.isGameOver) game.restart();
    game.start(); sync();
  }, [error, game, ready, sync, touch]);
  const pauseForExit = useCallback(() => {
    const wasActive = game.active; pause();
    return () => { if (wasActive) start(); };
  }, [game, pause, start]);
  return {
    game, touch, hud, ready, error, rooms, start, pause, pauseForExit, sync, onSurfaceLayout, onContextCreate,
    enterRooms() { if (!game.active) return; pause(); setRooms(true); },
    leaveRooms(view: TorpedoView) { game.setView(view); setRooms(false); start(); sync(); },
    setView(view: TorpedoView) { touch.reset(); game.clearKeys(); game.setView(view); sync(); },
  };
}
