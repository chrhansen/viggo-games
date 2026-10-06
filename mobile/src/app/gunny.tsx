import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, AppState, PixelRatio, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GunnyEngine, MISSION_KILLS, isCriticalHull, type GunnyState } from 'gunny/core';
import { GunnyControls } from '@/components/gunny/gunny-controls';
import { fonts } from '@/constants/theme';
import { createGunnyTouchInput } from '@/game/gunny/touch-input';
import { createNativeGunnyRenderer, loadGunnyAssets, type NativeGunnyRenderer } from '@/game/gunny/renderer';
import { useGunnyHullWarning } from '@/game/gunny/hull-warning';
import { useGameExit } from '@/hooks/use-game-exit';

export default function GunnyScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const surfaceScale = Math.max(1, PixelRatio.get() / 1.25);
  const surfaceKey = `${width}:${height}`;
  const currentSurface = useRef(surfaceKey);
  const runtime = useRef<NativeGunnyRenderer | null>(null);
  const [engine] = useState(() => new GunnyEngine());
  const [touch] = useState(createGunnyTouchInput);
  const alive = useRef(true);
  const frame = useRef(0);
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof loadGunnyAssets>> | null>(null);
  const [readySurface, setReadySurface] = useState('');
  const ready = readySurface === surfaceKey;
  const [running, setRunning] = useState(false);
  const active = running && ready;
  const [error, setError] = useState('');
  const [hud, setHud] = useState<GunnyState>({ ...engine.state });
  const critical = active && isCriticalHull(hud);
  const hullOpacity = useGunnyHullWarning(critical);
  const pause = useCallback(() => { engine.setActive(false); touch.reset(); setRunning(false); }, [engine, touch]);
  useFocusEffect(useCallback(() => pause, [pause]));
  useLayoutEffect(() => {
    currentSurface.current = surfaceKey;
    engine.setActive(false);
    touch.reset();
  }, [surfaceKey, engine, touch]);
  useEffect(() => {
    alive.current = true;
    loadGunnyAssets().then(loaded => { if (alive.current) setAssets(loaded); })
      .catch(() => { if (alive.current) setError('Space could not load. Return to the arcade and try again.'); });
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
    return () => {
      alive.current = false; subscription.remove(); cancelAnimationFrame(frame.current);
      engine.setActive(false); touch.reset(); runtime.current?.dispose(); runtime.current = null;
    };
  }, [engine, pause, touch]);
  function onContextCreate(gl: ExpoWebGLRenderingContext) {
    if (!assets || !alive.current || currentSurface.current !== surfaceKey) return;
    try {
      cancelAnimationFrame(frame.current); pause(); runtime.current?.dispose();
      const renderer = createNativeGunnyRenderer(gl, assets, engine);
      runtime.current = renderer; setError(''); setReadySurface(surfaceKey);
      let previous = 0, rendered = false, lastHud = '';
      function tick(time: number) {
        if (!alive.current || runtime.current !== renderer || currentSurface.current !== surfaceKey) return;
        try {
          const delta = previous ? (time - previous) / 1000 : 0;
          previous = time;
          if (AppState.currentState !== 'active' || (rendered && !engine.state.active)) {
            previous = 0; frame.current = requestAnimationFrame(tick); return;
          }
          renderer.game.step(delta, touch.input); renderer.render(); rendered = true;
          const state = engine.state;
          const key = `${state.health}:${state.score}:${state.kills}:${Math.round(state.distance)}:${state.result}`;
          if (key !== lastHud) { lastHud = key; setHud({ ...state }); }
          if (state.finished) { touch.reset(); setRunning(false); }
          frame.current = requestAnimationFrame(tick);
        } catch (error) {
          console.error('[Gunny frame]', error); pause(); setError('Graphics stopped. Return to the arcade and reopen Gunny.');
        }
      }
      frame.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error('[Gunny graphics]', error); setError('This device could not open space. Return to the arcade and try again.');
    }
  }
  const start = useCallback(() => {
    if (!ready || error || currentSurface.current !== surfaceKey || AppState.currentState !== 'active') return;
    touch.reset();
    if (!engine.state.started || engine.state.finished) { engine.start(); runtime.current?.game.resetCamera(); }
    else engine.setActive(true);
    setHud({ ...engine.state }); setRunning(true);
  }, [engine, error, ready, surfaceKey, touch]);
  const pauseForExit = useCallback(() => {
    const wasActive = engine.state.active; pause();
    return () => { if (wasActive) start(); };
  }, [engine, pause, start]);
  const requestExit = useGameExit('Gunny', pauseForExit);
  return <View style={styles.screen}>
    {assets && <View pointerEvents="none" style={{ position: 'absolute', width: width / surfaceScale, height: height / surfaceScale, transformOrigin: 'top left', transform: [{ scale: surfaceScale }] }}>
      <GLView key={surfaceKey} style={StyleSheet.absoluteFill} msaaSamples={0} onContextCreate={onContextCreate} />
    </View>}
    <View pointerEvents="box-none" style={[styles.interface, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exit Gunny" onPress={requestExit} style={styles.button}><Text style={styles.buttonText}>‹ BACK</Text></Pressable>
        <Text style={styles.mission}>GUNNY · 04</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Pause mission' : 'Resume mission'} disabled={!ready || !!error || !hud.started || hud.finished} onPress={active ? pause : start} style={styles.button}><Text style={styles.buttonText}>{active ? 'PAUSE' : 'RESUME'}</Text></Pressable>
      </View>
      <View pointerEvents="none" style={styles.stats}>
        <Animated.View style={[styles.stat, critical && styles.critical, { opacity: hullOpacity }]}><Text style={styles.statLabel}>HULL</Text><Text style={styles.statValue}>{Math.round(hud.health)}%</Text></Animated.View>
        <View style={styles.stat}><Text style={styles.statLabel}>SCORE</Text><Text style={styles.statValue}>{hud.score}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>RAIDERS</Text><Text style={styles.statValue}>{hud.kills}/{MISSION_KILLS}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>KM</Text><Text style={styles.statValue}>{Math.round(hud.distance)}</Text></View>
      </View>
      <View style={styles.spacer} pointerEvents="none" />
      {active && <GunnyControls touch={touch} />}
    </View>
    {!active && <View style={styles.overlay} pointerEvents="box-none">
      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.eyebrow}>{hud.finished ? hud.result === 'win' ? 'MISSION CLEAR' : 'HULL BREACH' : 'SPACE PATROL · 04'}</Text>
        <Text accessibilityRole="header" style={styles.title}>{hud.finished ? hud.result === 'win' ? 'Sector safe' : 'Try another run' : 'Gunny'}</Text>
        <Text style={styles.description}>{error || (hud.finished ? `Score ${hud.score}. ${hud.result === 'win' ? 'Earth still shining.' : 'You clipped too much metal.'}` : hud.started ? 'Your mission is paused. Your ship stays right where you left it.' : 'Earth below. Raiders ahead. Keep the sector safe.')}</Text>
        {!error && <>
          <Text style={styles.instructions}>Hold the arrows to steer in all four directions.{ '\n' }Hold Fire while steering to blast raiders.{ '\n' }Clear 12 raiders. Dodge satellites and expanding blasts.</Text>
          <Pressable accessibilityRole="button" disabled={!ready} onPress={start} style={[styles.start, !ready && styles.loading]}><Text style={styles.startText}>{!ready ? 'OPENING SPACE…' : hud.finished ? 'RESTART MISSION' : hud.started ? 'CONTINUE MISSION' : 'LAUNCH MISSION'}</Text></Pressable>
          <Text style={styles.credits}>Earth &amp; Moon imagery: Solar System Scope · CC BY 4.0</Text>
        </>}
      </ScrollView>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020408' },
  interface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#091A2CEE', borderRadius: 10 },
  buttonText: { fontFamily: fonts.extraBold, fontSize: 12, color: '#DBFAFF' },
  mission: { color: '#63F3FF', fontFamily: fonts.extraBold, fontSize: 13, letterSpacing: 1 },
  stats: { flexDirection: 'row', gap: 6, marginTop: 10 },
  stat: { flex: 1, borderRadius: 10, padding: 10, backgroundColor: '#091A2CEE' },
  statLabel: { color: '#91B8C8', fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1 },
  statValue: { color: '#DBFAFF', fontFamily: fonts.extraBold, fontSize: 18, marginTop: 3 },
  critical: { backgroundColor: '#A92038', borderWidth: 1, borderColor: '#FF8895' },
  spacer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 155 },
  card: { width: '100%', maxWidth: 420, flexGrow: 0, borderRadius: 22, backgroundColor: '#091A2CF5', borderWidth: 1, borderColor: '#63F3FF80' },
  cardContent: { padding: 24 },
  eyebrow: { color: '#63F3FF', fontSize: 11, letterSpacing: 2, fontFamily: fonts.bold },
  title: { color: '#DBFAFF', fontSize: 38, marginTop: 8, fontFamily: fonts.extraBold },
  description: { color: '#C1DCE8', fontSize: 15, lineHeight: 21, marginTop: 8, fontFamily: fonts.regular },
  instructions: { color: '#91B8C8', fontSize: 13, lineHeight: 21, marginVertical: 16, fontFamily: fonts.regular },
  start: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#63F3FF', borderRadius: 10 },
  startText: { color: '#091A2C', fontFamily: fonts.extraBold, fontSize: 13 },
  loading: { opacity: 0.6 },
  credits: { color: '#91B8C8', fontFamily: fonts.regular, fontSize: 10, lineHeight: 16, marginTop: 16 },
});
