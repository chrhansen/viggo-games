import { GLView } from 'expo-gl';
import { PixelRatio, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TorpedoView } from 'torpedo/game';
import { TorpedoControls } from '@/components/torpedo/torpedo-controls';
import { TorpedoRooms } from '@/components/torpedo/torpedo-rooms';
import { fonts } from '@/constants/theme';
import { useGameExit } from '@/hooks/use-game-exit';
import { useTorpedo } from '@/hooks/use-torpedo';

const views: readonly [TorpedoView, string][] = [['front', 'FRONT'], ['port', 'PORT'], ['starboard', 'STARBOARD'], ['periscope', 'SCOPE']];
export default function TorpedoScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const surfaceScale = Math.max(1, PixelRatio.get() / 1.25);
  const patrol = useTorpedo();
  const { hud, ready, error, rooms } = patrol;
  const active = hud.active && ready && !error;
  const requestExit = useGameExit('Torpedo', patrol.pauseForExit);
  const landscape = width > height;
  return <View style={styles.screen}>
    <View pointerEvents="none" style={{ position: 'absolute', width: width / surfaceScale, height: height / surfaceScale, transformOrigin: 'top left', transform: [{ scale: surfaceScale }] }}>
      <GLView style={StyleSheet.absoluteFill} msaaSamples={0} onLayout={patrol.onSurfaceLayout} onContextCreate={patrol.onContextCreate} />
    </View>
    <View pointerEvents="none" style={[styles.window, hud.view === 'periscope' && styles.scope, hud.hit && styles.hit]} />
    {!rooms && <View pointerEvents="none" style={styles.reticle}><Text style={styles.crosshair}>＋</Text></View>}
    <View pointerEvents="box-none" style={[styles.interface, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 8, paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exit Torpedo" onPress={requestExit} style={styles.button}><Text style={styles.buttonText}>‹ BACK</Text></Pressable>
        <Text style={styles.mission}>TORPEDO · 05</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Pause patrol' : 'Resume patrol'} disabled={!ready || !!error || !hud.started || hud.gameOver || rooms}
          onPress={active ? patrol.pause : patrol.start} style={styles.button}><Text style={styles.buttonText}>{active ? 'PAUSE' : 'RESUME'}</Text></Pressable>
      </View>
      <View pointerEvents="none" style={styles.stats}>
        <Text style={[styles.stat, hud.hull <= 55 && styles.critical]}>HULL {hud.hull}/{hud.maxHull}</Text>
        <Text style={styles.stat}>SCORE {hud.score}</Text>
        <Text style={styles.stat}>{hud.status.toUpperCase()}</Text>
      </View>
      {rooms ? <TorpedoRooms game={patrol.game} onReturn={patrol.leaveRooms} onChange={patrol.sync} /> : <>
        {active && <View style={styles.views}>
          {views.map(([view, label]) => <Pressable key={view} accessibilityRole="button" accessibilityLabel={`${label.toLowerCase()} view`} accessibilityState={{ selected: hud.view === view }}
            onPress={() => patrol.setView(view)} style={[styles.viewButton, hud.view === view && styles.selected]}><Text style={styles.viewText}>{label}</Text></Pressable>)}
          <Pressable accessibilityRole="button" accessibilityLabel="Visit submarine rooms" onPress={patrol.enterRooms} style={styles.viewButton}><Text style={styles.viewText}>ROOMS</Text></Pressable>
        </View>}
        <View pointerEvents="none" style={styles.spacer} />
        {active && <>
          <Text pointerEvents="none" style={styles.charge}>{hud.engineBroken ? 'ENGINE HIT · REPAIR IN ROOMS' : hud.ready ? 'TORPEDO READY' : 'RELOADING'}</Text>
          <TorpedoControls key={`${landscape}:${hud.view}`} touch={patrol.touch} periscope={hud.view === 'periscope'} />
        </>}
      </>}
    </View>
    {!active && !rooms && <View style={[styles.overlay, { top: insets.top + 96, bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <Text style={styles.eyebrow}>{hud.gameOver ? 'HULL BREACHED' : 'SUBMARINE PATROL · 05'}</Text>
        <Text accessibilityRole="header" style={styles.title}>{hud.gameOver ? 'Dive again' : 'Torpedo'}</Text>
        <Text style={styles.description}>{error || (hud.gameOver ? `Score ${hud.score}. Start a fresh patrol and try a sneakier dodge.` : hud.started ? 'Patrol paused. Your submarine stays right where you left it.' : 'Lead your fleet through the deep. Dodge incoming torpedoes and keep the hull together.')}</Text>
        {!error && <>
          <Text style={styles.instructions}>Hold the arrows to steer. Hold Fire to launch torpedoes.{ '\n' }Switch windows or use Scope and its turning arrows.{ '\n' }Visit Rooms to rest, ping sonar, and repair the engine.</Text>
          <Pressable accessibilityRole="button" disabled={!ready} onPress={patrol.start} style={[styles.start, !ready && styles.loading]}><Text style={styles.startText}>{!ready ? 'OPENING OCEAN…' : hud.gameOver ? 'RESTART PATROL' : hud.started ? 'CONTINUE PATROL' : 'START PATROL'}</Text></Pressable>
        </>}
      </ScrollView>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#163B46' }, interface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  window: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 8, borderColor: '#122C35' },
  scope: { borderWidth: 18, borderRadius: 100, borderColor: '#061C25' }, hit: { borderColor: '#D34E48' },
  reticle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, crosshair: { color: '#B8E8DD90', fontSize: 32 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#0A222BEE', borderRadius: 10 },
  buttonText: { fontFamily: fonts.extraBold, fontSize: 12, color: '#DFF7F2' }, mission: { color: '#8FE7FF', fontFamily: fonts.extraBold, fontSize: 13, letterSpacing: 1 },
  stats: { flexDirection: 'row', gap: 6, marginTop: 6 }, stat: { flex: 1, textAlign: 'center', borderRadius: 8, paddingVertical: 8, backgroundColor: '#0A222BEE', color: '#DFF7F2', fontFamily: fonts.bold, fontSize: 11 },
  critical: { backgroundColor: '#A03135' }, views: { flexDirection: 'row', gap: 4, marginTop: 6 },
  viewButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#0A222BEE', borderWidth: 1, borderColor: '#46676B' },
  selected: { borderColor: '#F5D360' }, viewText: { color: '#DFF7F2', fontFamily: fonts.bold, fontSize: 9 },
  spacer: { flex: 1 }, charge: { color: '#F5D360', fontFamily: fonts.bold, fontSize: 10, textAlign: 'right', marginBottom: 6 },
  overlay: { position: 'absolute', left: 20, right: 20, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 440, flexGrow: 0, borderRadius: 22, backgroundColor: '#0A222BF5', borderWidth: 1, borderColor: '#8FE7FF80' }, cardContent: { padding: 22 },
  eyebrow: { color: '#8FE7FF', fontSize: 11, letterSpacing: 2, fontFamily: fonts.bold }, title: { color: '#DFF7F2', fontSize: 36, marginTop: 6, fontFamily: fonts.extraBold },
  description: { color: '#C1DCE0', fontSize: 15, lineHeight: 21, marginTop: 8, fontFamily: fonts.regular },
  instructions: { color: '#A8C8CA', fontSize: 13, lineHeight: 21, marginVertical: 14, fontFamily: fonts.regular },
  start: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5D360', borderRadius: 10 }, startText: { color: '#102F36', fontFamily: fonts.extraBold, fontSize: 13 }, loading: { opacity: 0.6 },
});
