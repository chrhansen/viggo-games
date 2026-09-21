import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { touchMoveVector, TOUCH_LOOK_SENSITIVITY } from 'hunter-guy/core';

export function HunterLookPad({ onLook }: { onLook: (yaw: number, pitch: number) => void }) {
  const touch = useRef<{ id: string; x: number; y: number } | null>(null);
  function move(event: GestureResponderEvent) {
    const previous = touch.current;
    if (!previous) return;
    const current = event.nativeEvent.changedTouches.find((entry) => entry.identifier === previous.id);
    if (!current) return;
    onLook(-(current.pageX - previous.x) * TOUCH_LOOK_SENSITIVITY,
      (current.pageY - previous.y) * TOUCH_LOOK_SENSITIVITY);
    touch.current = { id: previous.id, x: current.pageX, y: current.pageY };
  }
  function end(event: GestureResponderEvent) {
    if (event.nativeEvent.changedTouches.some((entry) => entry.identifier === touch.current?.id)) touch.current = null;
  }
  return <View accessibilityLabel="Drag to look around" style={StyleSheet.absoluteFill}
    onTouchStart={(event) => {
      if (touch.current) return;
      const first = event.nativeEvent.changedTouches[0];
      touch.current = { id: first.identifier, x: first.pageX, y: first.pageY };
    }} onTouchMove={move} onTouchEnd={end} onTouchCancel={end} />;
}

export function HunterTouchControls({ onMove, onFire }: {
  onMove: (x: number, y: number) => void; onFire: () => void;
}) {
  const touch = useRef<{ id: string; centerX: number; centerY: number } | null>(null);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  function move(event: GestureResponderEvent) {
    const origin = touch.current;
    if (!origin) return;
    const current = event.nativeEvent.changedTouches.find((entry) => entry.identifier === origin.id);
    if (!current) return;
    const vector = touchMoveVector((current.pageX - origin.centerX) / 60, (origin.centerY - current.pageY) / 60);
    onMove(vector.x, vector.y); setThumb(vector);
  }
  function end(event: GestureResponderEvent) {
    if (!event.nativeEvent.changedTouches.some((entry) => entry.identifier === touch.current?.id)) return;
    touch.current = null; onMove(0, 0); setThumb({ x: 0, y: 0 });
  }
  return <View pointerEvents="box-none" style={styles.row}>
    <View accessibilityLabel="Movement joystick" style={styles.pad}
      onTouchStart={(event) => {
        if (touch.current) return;
        const first = event.nativeEvent.changedTouches[0];
        touch.current = { id: first.identifier, centerX: first.pageX - first.locationX + 60, centerY: first.pageY - first.locationY + 60 };
        move(event);
      }} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Text style={styles.arrows}>↑</Text>
        <View style={[styles.thumb, { transform: [{ translateX: thumb.x * 32 }, { translateY: -thumb.y * 32 }] }]} />
        <Text style={styles.move}>MOVE</Text>
      </View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Use selected tool" onPressIn={onFire} style={({ pressed }) => [styles.fire, pressed && styles.pressed]}>
      <Text style={styles.fireIcon}>◎</Text><Text style={styles.fireText}>USE TOOL</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pad: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#10291DDD', borderWidth: 2, borderColor: '#E6D8A67A', alignItems: 'center' },
  arrows: { textAlign: 'center', color: '#E6D8A6', fontSize: 24 },
  thumb: { position: 'absolute', top: 39, left: 39, width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0DB91', borderWidth: 3, borderColor: '#FFF4D3' },
  move: { position: 'absolute', bottom: 9, alignSelf: 'center', color: '#E6D8A6', fontSize: 10, letterSpacing: 2, fontFamily: 'BricolageGrotesque_700Bold' },
  fire: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#F0DB91', borderWidth: 3, borderColor: '#FFF4D3', alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: '#D8BE68', transform: [{ scale: 0.96 }] },
  fireIcon: { color: '#163321', fontSize: 37, lineHeight: 43 },
  fireText: { color: '#163321', fontSize: 11, fontFamily: 'BricolageGrotesque_800ExtraBold' },
});
