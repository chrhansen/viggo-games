import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ROOMS, type RoomKind } from 'torpedo/rooms';
import type { TorpedoGame, TorpedoView } from 'torpedo/game';
import { fonts } from '@/constants/theme';

const artwork: Record<RoomKind, number> = {
  steering: require('torpedo/assets/rooms/control.webp'),
  sonar: require('torpedo/assets/rooms/sonar.webp'),
  bunks: require('torpedo/assets/rooms/bunks.webp'),
  galley: require('torpedo/assets/rooms/galley.webp'),
  engine: require('torpedo/assets/rooms/engine.webp'),
};
export function TorpedoRooms({ game, onReturn, onChange }: { game: TorpedoGame; onReturn: (view: TorpedoView) => void; onChange: () => void }) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('Patrol paused. Take care of your crew.');
  const { width, height } = useWindowDimensions();
  const room = ROOMS[index];
  return <View style={styles.panel}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabContent}>
      {ROOMS.map((entry, i) => <Pressable key={entry.kind} accessibilityRole="button" accessibilityState={{ selected: i === index }}
        onPress={() => { setIndex(i); setStatus('Ready'); }} style={[styles.tab, i === index && styles.selected]}>
        <Text style={styles.tabText}>{entry.title}</Text>
      </Pressable>)}
    </ScrollView>
    <ScrollView contentContainerStyle={[styles.content, width > height && styles.landscape]}>
      <Image accessibilityLabel={room.title} source={artwork[room.kind]} contentFit="contain" style={[styles.art, width > height && styles.landscapeArt]} />
      <View style={styles.details}>
        <Text style={styles.eyebrow}>{room.meter.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{room.title}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
        <Pressable accessibilityRole="button" onPress={() => { setStatus(game.performInteriorAction(room.action)); onChange(); }} style={styles.action}>
          <Text style={styles.actionText}>{room.actionLabel.toUpperCase()}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onReturn(room.view)} style={styles.return}>
          <Text style={styles.tabText}>RETURN TO PATROL →</Text>
        </Pressable>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  panel: { flex: 1, marginTop: 10, borderRadius: 18, backgroundColor: '#0A222BF5', overflow: 'hidden' },
  tabs: { flexGrow: 0, flexShrink: 0 }, tabContent: { padding: 10, gap: 8 },
  tab: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, backgroundColor: '#183E46' },
  selected: { borderWidth: 1, borderColor: '#F5D360' }, tabText: { fontFamily: fonts.bold, fontSize: 12, color: '#DFF7F2' },
  content: { padding: 14, gap: 16 }, landscape: { flexDirection: 'row', alignItems: 'center' },
  art: { width: '100%', aspectRatio: 1.5, borderRadius: 12 }, landscapeArt: { width: '48%' },
  details: { flex: 1, gap: 10 }, eyebrow: { fontFamily: fonts.bold, fontSize: 11, color: '#8FE7FF', letterSpacing: 1 },
  title: { fontFamily: fonts.extraBold, fontSize: 26, color: '#DFF7F2' }, status: { fontFamily: fonts.regular, fontSize: 14, color: '#A8C8CA', lineHeight: 20 },
  action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5D360', borderRadius: 10 },
  actionText: { fontFamily: fonts.extraBold, fontSize: 13, color: '#102F36' }, return: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
