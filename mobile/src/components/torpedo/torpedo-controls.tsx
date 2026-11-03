import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { fonts } from '@/constants/theme';
import type { TorpedoControl, TorpedoTouchInput } from '@/game/torpedo/touch-input';

function HoldButton({ control, label, touch }: { control: TorpedoControl; label: string; touch: TorpedoTouchInput }) {
  const [pressed, setPressed] = useState(false);
  const ids = (event: GestureResponderEvent) => event.nativeEvent.changedTouches.map(entry => entry.identifier);
  function release(event: GestureResponderEvent) { touch.release(ids(event)); setPressed(touch.held(control)); }
  return <View accessibilityRole="button" accessibilityLabel={`Hold ${control}`} style={[styles.button, control === 'fire' && styles.fire, pressed && styles.pressed]}
    onTouchStart={event => { touch.hold(control, ids(event)); setPressed(true); }} onTouchEnd={release} onTouchCancel={release}>
    <Text pointerEvents="none" style={[styles.label, control === 'fire' && styles.fireText]}>{label}</Text>
  </View>;
}
export function TorpedoControls({ touch, periscope }: { touch: TorpedoTouchInput; periscope: boolean }) {
  return <View pointerEvents="box-none" style={styles.controls}>
    <View style={styles.pad}>
      <HoldButton control="up" label="↑" touch={touch} />
      <View style={styles.row}>
        <HoldButton control="left" label="←" touch={touch} />
        <HoldButton control="down" label="↓" touch={touch} />
        <HoldButton control="right" label="→" touch={touch} />
      </View>
    </View>
    <View style={styles.pad}>
      {periscope && <View style={styles.row}>
        <HoldButton control="turnLeft" label="↶" touch={touch} />
        <HoldButton control="turnRight" label="↷" touch={touch} />
      </View>}
      <HoldButton control="fire" label="FIRE" touch={touch} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  pad: { alignItems: 'center', gap: 6 }, row: { flexDirection: 'row', gap: 6 },
  button: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#102F36EE', borderWidth: 1, borderColor: '#8FE7FF80', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#DFF7F2', fontFamily: fonts.extraBold, fontSize: 24 },
  fire: { width: 86, height: 62, borderColor: '#FFE4A2', backgroundColor: '#F5D360' },
  fireText: { color: '#102F36', fontSize: 16 }, pressed: { borderColor: '#FFFFFF', transform: [{ scale: 0.95 }] },
});
