import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { weaponStats } from 'hunter-guy/core';
import type { Weapon } from 'hunter-guy/scene';
import { HunterLookPad, HunterTouchControls } from '@/components/hunter-guy/hunter-touch-controls';
import { createNativeHunterRenderer, loadHunterAssets, type NativeHunterRenderer } from '@/game/hunter-guy/renderer';
import { useHunterAudio } from '@/game/hunter-guy/audio';

const weapons = Object.keys(weaponStats) as Weapon[];
export default function HunterGuyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const runtime = useRef<NativeHunterRenderer | null>(null);
  const alive = useRef(true);
  const frame = useRef(0);
  const movement = useRef({ forward: 0, strafe: 0 });
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof loadHunterAssets>> | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [hud, setHud] = useState({ score: 0, message: 'Rifle ready', weapon: 'rifle' as Weapon });
  const play = useHunterAudio();
  const pause = useCallback(() => {
    runtime.current?.game.engine.setActive(false);
    movement.current = { forward: 0, strafe: 0 };
    setActive(false);
  }, []);
  useFocusEffect(useCallback(() => pause, [pause]));
  useEffect(() => {
    alive.current = true;
    loadHunterAssets().then((loaded) => { if (alive.current) setAssets(loaded); })
      .catch(() => { if (alive.current) setError('The forest could not load. Return to the arcade and try again.'); });
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
      const engine = runtime.current?.game.engine;
      pause();
      runtime.current?.dispose();
      const renderer = createNativeHunterRenderer(gl, assets, engine);
      setError('');
      runtime.current = renderer;
      setReady(true);
      let previous = 0;
      let lastHud = '';
      function tick(time: number) {
        if (!alive.current || runtime.current !== renderer) return;
        try {
          const delta = previous ? Math.min((time - previous) / 1000, 0.1) : 0;
          previous = time;
          if (AppState.currentState !== 'active') { previous = 0; frame.current = requestAnimationFrame(tick); return; }
          renderer.game.step(delta, movement.current);
          renderer.render();
          const state = renderer.game.engine.state;
          const key = `${state.score}:${state.message}:${state.selectedWeapon}`;
          if (key !== lastHud) {
            lastHud = key;
            setHud({ score: state.score, message: state.message, weapon: state.selectedWeapon });
          }
          frame.current = requestAnimationFrame(tick);
        } catch (error) {
          console.error('[Hunter Guy frame]', error);
          pause();
          setError('Graphics stopped. Return to the arcade and reopen Hunter Guy.');
        }
      }
      frame.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error('[Hunter Guy graphics]', error);
      setError('This device could not open the forest. Return to the arcade and try again.');
    }
  }
  function start() {
    if (!ready || AppState.currentState !== 'active') return;
    runtime.current?.game.engine.setActive(true);
    setStarted(true); setActive(true);
  }
  return <View style={styles.screen}>
    {assets && <GLView style={StyleSheet.absoluteFill} msaaSamples={0} onContextCreate={onContextCreate} />}
    {active && <HunterLookPad onLook={(yaw, pitch) => {
      const engine = runtime.current?.game.engine;
      if (engine) engine.look(engine.state.player.yaw + yaw, engine.state.player.pitch + pitch);
    }} />}
    <View pointerEvents="box-none" style={[styles.interface, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to arcade" onPress={() => { pause(); router.back(); }} style={styles.button}><Text style={styles.buttonText}>‹ ARCADE</Text></Pressable>
        <View style={styles.score}><Text style={styles.scoreText}>{hud.score} TAGGED</Text></View>
        <Pressable accessibilityRole="button" disabled={!ready || !!error} onPress={active ? pause : start} style={styles.button}><Text style={styles.buttonText}>{active ? 'PAUSE' : 'RESUME'}</Text></Pressable>
      </View>
      {active && <>
        <View style={styles.belt}>{weapons.map((weapon) => <Pressable key={weapon} accessibilityRole="button" accessibilityState={{ selected: hud.weapon === weapon }} accessibilityLabel={weaponStats[weapon].name} onPress={() => runtime.current?.game.engine.setWeapon(weapon)} style={[styles.tool, hud.weapon === weapon && styles.selected]}><Text style={[styles.toolText, hud.weapon === weapon && styles.selectedText]}>{weaponStats[weapon].name}</Text></Pressable>)}</View>
        <Text pointerEvents="none" style={styles.status}>{hud.message}</Text>
        <View pointerEvents="none" style={styles.crosshair}><Text style={styles.crosshairText}>+</Text></View>
        <View style={styles.spacer} pointerEvents="none" />
        <HunterTouchControls onMove={(strafe, forward) => { movement.current = { strafe, forward }; }} onFire={() => {
          const game = runtime.current?.game;
          if (game?.fire()) play(game.engine.state.selectedWeapon);
        }} />
      </>}
    </View>
    {!active && <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>FOREST EXPEDITION · 02</Text>
        <Text style={styles.title}>Hunter Guy</Text>
        <Text style={styles.description}>{error || (started ? 'Your hunt is paused.' : 'Track foxes, deer, and bears. Explore the forest at your own pace.')}</Text>
        {!error && <><Text style={styles.instructions}>Left thumb to move · Drag to look{ '\n' }Choose a tool · Aim at an animal · Tap Use Tool</Text><Pressable accessibilityRole="button" disabled={!ready} onPress={start} style={[styles.start, !ready && styles.loading]}><Text style={styles.startText}>{!ready ? 'GROWING THE FOREST…' : started ? 'CONTINUE HUNT' : 'START HUNT'}</Text></Pressable></>}
      </View>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#183124' },
  interface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#10291DEB', borderRadius: 9 },
  buttonText: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 12, color: '#FFF3CE' },
  score: { padding: 11, backgroundColor: '#F0DB91', borderRadius: 9 },
  scoreText: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 12, color: '#163321' },
  belt: { flexDirection: 'row', gap: 6, marginTop: 10 },
  tool: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, backgroundColor: '#10291DEB', borderWidth: 1, borderColor: '#E6D8A655' },
  selected: { backgroundColor: '#F0DB91', borderColor: '#FFF3CE' },
  toolText: { fontFamily: 'BricolageGrotesque_700Bold', fontSize: 12, color: '#FFF3CE' },
  selectedText: { color: '#163321' },
  status: { alignSelf: 'center', color: '#FFF3CE', backgroundColor: '#10291DBB', borderRadius: 6, padding: 7, marginTop: 8, fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 13 },
  crosshair: { position: 'absolute', left: '50%', top: '50%', marginLeft: -12, marginTop: -18 },
  crosshairText: { color: '#FFFFFF', fontSize: 30, textShadowColor: '#10291D', textShadowRadius: 3 },
  spacer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 85 },
  card: { width: '100%', maxWidth: 440, borderRadius: 22, padding: 24, backgroundColor: '#10291DF5', borderWidth: 1, borderColor: '#E6D8A67A' },
  eyebrow: { color: '#E0C976', fontSize: 11, letterSpacing: 2, fontFamily: 'BricolageGrotesque_700Bold' },
  title: { color: '#FFF3CE', fontSize: 38, marginTop: 8, fontFamily: 'BricolageGrotesque_800ExtraBold' },
  description: { color: '#E4E9D7', fontSize: 15, lineHeight: 21, marginTop: 8, fontFamily: 'BricolageGrotesque_400Regular' },
  instructions: { color: '#BDCFB6', fontSize: 12, lineHeight: 20, marginVertical: 16, fontFamily: 'BricolageGrotesque_400Regular' },
  start: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0DB91', borderRadius: 10 },
  startText: { color: '#163321', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13 },
  loading: { opacity: 0.6 },
});
