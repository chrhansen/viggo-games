import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { fonts } from '@/constants/theme';
import type { BurbControl, BurbTouchInput } from '@/game/burb/touch-input';

function HoldButton({ control, label, touch, accent = false }: {
  control: BurbControl; label: string; touch: BurbTouchInput; accent?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const ids = (event: GestureResponderEvent) => event.nativeEvent.changedTouches.map((entry) => entry.identifier);
  function end(event: GestureResponderEvent) {
    touch.release(ids(event));
    setPressed(touch.input[control]);
  }
  return <View accessibilityRole="button" accessibilityLabel={`Hold ${label.toLowerCase()}`} style={[styles.button, accent && styles.accent, pressed && styles.pressed]}
    onTouchStart={(event) => { touch.hold(control, ids(event)); setPressed(true); }}
    onTouchEnd={end} onTouchCancel={end}>
    <Text pointerEvents="none" style={[styles.label, accent && styles.accentLabel]}>{label}</Text>
  </View>;
}

export function BurbControls({ touch }: { touch: BurbTouchInput }) {
  return <View pointerEvents="box-none" style={styles.row}>
    <View style={styles.group}>
      <HoldButton control="left" label="LEFT" touch={touch} />
      <HoldButton control="right" label="RIGHT" touch={touch} />
    </View>
    <View style={styles.group}>
      <HoldButton control="brake" label="SLOW" touch={touch} />
      <HoldButton control="accelerate" label="FAST" touch={touch} accent />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  group: { flexDirection: 'row', gap: 6 },
  button: { minWidth: 58, minHeight: 64, borderRadius: 15, backgroundColor: '#102B35EE', borderWidth: 2, borderColor: '#D0E1E47A', alignItems: 'center', justifyContent: 'center' },
  accent: { backgroundColor: '#FFE07D', borderColor: '#FFF2C0' },
  pressed: { borderColor: '#FF7A99', transform: [{ scale: 0.95 }] },
  label: { fontFamily: fonts.extraBold, fontSize: 12, color: '#FFF5DD' },
  accentLabel: { color: '#102B35' },
});
