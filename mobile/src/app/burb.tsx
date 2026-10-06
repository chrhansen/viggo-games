import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, PixelRatio, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BurbGame } from 'burb/core';
import { BurbControls } from '@/components/burb/burb-controls';
import { fonts } from '@/constants/theme';
import { createBurbTouchInput } from '@/game/burb/touch-input';
import { createNativeBurbRenderer, loadBurbAssets, type NativeBurbRenderer } from '@/game/burb/renderer';
import { useGameExit } from '@/hooks/use-game-exit';
import { useBurbMotion } from '@/hooks/use-burb-motion';

export default function BurbScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const surfaceScale = Math.max(1, PixelRatio.get() / 1.25);
  const runtime = useRef<NativeBurbRenderer | null>(null);
  const engine = useRef<BurbGame | undefined>(undefined);
  const alive = useRef(true);
  const frame = useRef(0);
  const [touch] = useState(createBurbTouchInput);
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof loadBurbAssets>> | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setActive] = useState(false);
  const active = running && ready;
  const landscape = width > height;
  const motion = useBurbMotion(touch, landscape, active);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(43);

  const pause = useCallback(() => {
    engine.current?.setActive(false);
    touch.reset();
    setActive(false);
  }, [touch]);
  useFocusEffect(useCallback(() => pause, [pause]));
  useLayoutEffect(() => {
    touch.reset();
  }, [width, height, touch]);
  useEffect(() => {
    alive.current = true;
    loadBurbAssets().then((loaded) => { if (alive.current) setAssets(loaded); })
      .catch(() => { if (alive.current) setError('The road could not load. Return to the arcade and try again.'); });
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') pause(); });
    return () => {
      alive.current = false;
      subscription.remove();
      cancelAnimationFrame(frame.current);
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, [pause]);

  function onContextCreate(gl: ExpoWebGLRenderingContext) {
    if (!assets || !alive.current) return;
    try {
      cancelAnimationFrame(frame.current);
      runtime.current?.dispose();
      const renderer = createNativeBurbRenderer(gl, assets, engine.current);
      runtime.current = renderer;
      engine.current = renderer.game.engine;
      setError('');
      setReady(true);
      let previous = 0;
      let rendered = false;
      let lastSpeed = -1;
      function tick(time: number) {
        if (!alive.current || runtime.current !== renderer) return;
        try {
          const delta = previous ? (time - previous) / 1000 : 0;
          previous = time;
          if (AppState.currentState !== 'active' || (rendered && !renderer.game.engine.state.active)) {
            previous = 0;
            frame.current = requestAnimationFrame(tick);
            return;
          }
          motion.input.apply(Date.now());
          renderer.game.step(delta, touch.input);
          renderer.render();
          rendered = true;
          const currentSpeed = Math.round(renderer.game.engine.state.speed * 3.6);
          if (currentSpeed !== lastSpeed) { lastSpeed = currentSpeed; setSpeed(currentSpeed); }
          frame.current = requestAnimationFrame(tick);
        } catch (error) {
          console.error('[Burb frame]', error);
          pause();
          setError('Graphics stopped. Return to the arcade and reopen Burb.');
        }
      }
      frame.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error('[Burb graphics]', error);
      pause();
      setError('This device could not open the road. Return to the arcade and try again.');
    }
  }
  const start = useCallback(() => {
    if (!ready || error || AppState.currentState !== 'active') return;
    touch.reset();
    engine.current?.setActive(true);
    setStarted(true);
    setActive(true);
  }, [error, ready, touch]);
  const pauseForExit = useCallback(() => {
    const wasActive = engine.current?.state.active;
    pause();
    return () => { if (wasActive) start(); };
  }, [pause, start]);
  const requestExit = useGameExit('Burb', pauseForExit);

  return <View style={styles.screen}>
    {assets && <View pointerEvents="none" style={{ position: 'absolute', width: width / surfaceScale, height: height / surfaceScale, transformOrigin: 'top left', transform: [{ scale: surfaceScale }] }}>
      <GLView style={StyleSheet.absoluteFill} msaaSamples={0} onContextCreate={onContextCreate} />
    </View>}
    <View pointerEvents="box-none" style={[styles.interface, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exit Burb" onPress={requestExit} style={styles.button}><Text style={styles.buttonText}>‹ BACK</Text></Pressable>
        <View style={styles.meter}><Text style={styles.speed}>{speed} <Text style={styles.unit}>KM/H</Text></Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Pause ride' : 'Resume ride'} disabled={!ready || !!error} onPress={active ? pause : start} style={styles.button}><Text style={styles.buttonText}>{active ? 'PAUSE' : 'RESUME'}</Text></Pressable>
      </View>
      <View style={styles.spacer} pointerEvents="none" />
      {active && <BurbControls touch={touch} tilt={motion.enabled} recenter={motion.recenter} />}
    </View>
    {!active && <View style={styles.overlay} pointerEvents="box-none">
      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.eyebrow}>OPEN ROAD · 03</Text>
        <Text style={styles.title}>Burb Ride</Text>
        <Text style={styles.description}>{error || (started ? 'Your ride is paused. The bike stays right where you left it.' : 'Mountain air. Winding asphalt. Your own pace.')}</Text>
        {!error && <>
          <Text style={styles.instructions}>{motion.enabled ? 'Hold the phone upright in landscape. Twist slightly left or right to steer. Center tilt resets straight ahead.' : 'Hold Left or Right to steer. In landscape, tilt the upright phone left or right.'}{ '\n' }Hold Fast or Slow to change speed.{ '\n' }Release the speed buttons to cruise.</Text>
          {landscape && motion.status === 'denied' && <Pressable accessibilityRole="button" onPress={motion.enable} style={styles.motionPermission}><Text style={styles.permissionText}>ENABLE MOTION FOR TILT</Text></Pressable>}
          {landscape && motion.status === 'unavailable' && <Text style={styles.motionNote}>Motion is unavailable. Use the steering buttons.</Text>}
          <Pressable accessibilityRole="button" disabled={!ready} onPress={start} style={[styles.start, !ready && styles.loading]}><Text style={styles.startText}>{!ready ? 'OPENING THE ROAD…' : started ? 'CONTINUE RIDE' : 'START RIDE'}</Text></Pressable>
        </>}
      </ScrollView>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#87BFE8' },
  interface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#102B35EE', borderRadius: 10 },
  buttonText: { fontFamily: fonts.extraBold, fontSize: 12, color: '#FFF5DD' },
  meter: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFE07D', borderRadius: 10 },
  speed: { fontFamily: fonts.extraBold, fontSize: 20, color: '#102B35' },
  unit: { fontSize: 10 },
  spacer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 95 },
  card: { width: '100%', maxWidth: 400, flexGrow: 0, borderRadius: 22, backgroundColor: '#102B35F5', borderWidth: 1, borderColor: '#D0E1E47A' },
  cardContent: { padding: 24 },
  eyebrow: { color: '#FF9EB3', fontSize: 11, letterSpacing: 2, fontFamily: fonts.bold },
  title: { color: '#FFF5DD', fontSize: 38, marginTop: 8, fontFamily: fonts.extraBold },
  description: { color: '#DCE8E8', fontSize: 15, lineHeight: 21, marginTop: 8, fontFamily: fonts.regular },
  instructions: { color: '#BED4D8', fontSize: 13, lineHeight: 21, marginVertical: 16, fontFamily: fonts.regular },
  start: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE07D', borderRadius: 10 },
  startText: { color: '#102B35', fontFamily: fonts.extraBold, fontSize: 13 },
  loading: { opacity: 0.6 },
  motionPermission: { minHeight: 44, justifyContent: 'center', marginBottom: 12 },
  permissionText: { fontFamily: fonts.bold, color: '#FFE07D', fontSize: 12 },
  motionNote: { fontFamily: fonts.regular, color: '#BED4D8', fontSize: 12, marginBottom: 12 },
});
