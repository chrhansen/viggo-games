import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { fonts } from '@/constants/theme';
import type { GunnyControl, GunnyTouchInput } from '@/game/gunny/touch-input';

function HoldButton({ control, label, touch }: { control: GunnyControl; label: string; touch: GunnyTouchInput }) {
  const [pressed, setPressed] = useState(false);
  const ids = (event: GestureResponderEvent) => event.nativeEvent.changedTouches.map(entry => entry.identifier);
  function release(event: GestureResponderEvent) { touch.release(ids(event)); setPressed(touch.input[control]); }
  return <View accessibilityRole="button" accessibilityLabel={`Hold ${control}`} style={[styles.button, control === 'fire' && styles.fire, pressed && styles.pressed]}
    onTouchStart={event => { touch.hold(control, ids(event)); setPressed(true); }} onTouchEnd={release} onTouchCancel={release}>
    <Text pointerEvents="none" style={[styles.label, control === 'fire' && styles.fireText]}>{label}</Text>
  </View>;
}
export function GunnyControls({ touch }: { touch: GunnyTouchInput }) {
  return <View pointerEvents="box-none" style={styles.controls}>
    <View style={styles.pad}>
      <HoldButton control="up" label="↑" touch={touch} />
      <View style={styles.row}>
        <HoldButton control="left" label="←" touch={touch} />
        <HoldButton control="down" label="↓" touch={touch} />
        <HoldButton control="right" label="→" touch={touch} />
      </View>
    </View>
    <HoldButton control="fire" label="FIRE" touch={touch} />
  </View>;
}
const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  pad: { alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  button: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#091A2CEE', borderWidth: 1, borderColor: '#63F3FF80', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#DBFAFF', fontFamily: fonts.extraBold, fontSize: 25 },
  fire: { width: 86, height: 80, borderColor: '#BCFBFF', backgroundColor: '#63F3FF' },
  fireText: { color: '#091A2C', fontSize: 16 },
  pressed: { borderColor: '#FFFFFF', transform: [{ scale: 0.95 }] },
});
