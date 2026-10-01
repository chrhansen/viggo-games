import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArcadeBackdrop } from '@/components/arcade-backdrop';
import { colors, fonts } from '@/constants/theme';
import { gameDetails } from '@/data/games';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const game = gameDetails.find((entry) => entry.id === id);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };

  if (!game) return <SafeAreaView style={styles.screen}>
    <View style={styles.notFound}>
      <Text accessibilityRole="header" style={styles.title}>Mission not found</Text>
      <Pressable accessibilityRole="button" onPress={back} style={styles.back}>
        <Text style={styles.backText}>← BACK TO ARCADE</Text>
      </Pressable>
    </View>
  </SafeAreaView>;

  return <SafeAreaView style={styles.screen}>
    <StatusBar style="light" />
    <ArcadeBackdrop />
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to arcade" onPress={back} style={styles.back}>
        <Text style={styles.backText}>← ARCADE</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: game.color }]}>MISSION {game.level}</Text>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={[styles.layout, landscape && styles.landscape]}>
        <View style={[styles.hero, landscape && styles.heroLandscape]}>
          <Image source={game.image} accessibilityLabel={`${game.title} artwork`} contentFit="cover" style={styles.artwork} />
          <View style={[styles.heroRail, { backgroundColor: game.color }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: game.color }]}>{game.genre.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>{game.title}</Text>
            <Text style={styles.tagline}>{game.tagline}</Text>
          </View>
        </View>
        <View style={[styles.briefing, landscape && styles.briefingLandscape]}>
          <Text style={styles.description}>{game.description}</Text>
          <Text accessibilityRole="header" style={styles.sectionTitle}>How to play</Text>
          {game.howToPlay.map((step, index) => <View key={step} style={styles.step}>
            <Text style={[styles.stepNumber, { color: game.color }]}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.body}>{step}</Text>
          </View>)}
          {game.touchControls.length > 0 && <View style={styles.controls}>
            <Text accessibilityRole="header" style={[styles.eyebrow, { color: game.color }]}>AT YOUR FINGERTIPS</Text>
            {game.touchControls.map((control) => <Text key={control} style={styles.controlText}>{control}</Text>)}
          </View>}
          <Text accessibilityRole="header" style={styles.sectionTitle}>Field notes</Text>
          {game.tips.map((tip) => <View key={tip} style={styles.tip}>
            <View style={[styles.tipDot, { backgroundColor: game.color }]} />
            <Text style={styles.body}>{tip}</Text>
          </View>)}
        </View>
      </View>
    </ScrollView>
    <View style={styles.launchBar}>
      {game.route ? <Pressable accessibilityRole="button" accessibilityLabel={`Play ${game.title} now`}
        onPress={() => router.push(game.route!)} style={({ pressed }) => [styles.play, { backgroundColor: game.color }, pressed && styles.pressed]}>
        <Text style={styles.playText}>PLAY NOW</Text><Text style={styles.playArrow}>→</Text>
      </Pressable> : <View style={styles.unavailable}>
        <Text style={styles.unavailableTitle}>COMING TO MOBILE</Text>
        <Text style={styles.unavailableText}>This mission is still in development.</Text>
      </View>}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.surface },
  backText: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 2 },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 30 },
  layout: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  landscape: { maxWidth: 1100, flexDirection: 'row', alignItems: 'flex-start', gap: 28 },
  hero: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  heroLandscape: { flex: 1 },
  artwork: { width: '100%', aspectRatio: 16 / 9 },
  heroRail: { height: 4 },
  heroCopy: { padding: 22 },
  title: { color: colors.foreground, fontFamily: fonts.extraBold, fontSize: 40, lineHeight: 44, letterSpacing: -1.8, marginTop: 8 },
  tagline: { color: colors.muted, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, marginTop: 8 },
  briefing: { paddingTop: 24 },
  briefingLandscape: { flex: 1, paddingTop: 0 },
  description: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 17, lineHeight: 26 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.extraBold, fontSize: 25, letterSpacing: -0.7, marginTop: 28, marginBottom: 16 },
  step: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  stepNumber: { fontFamily: fonts.extraBold, fontSize: 21, width: 30 },
  body: { flex: 1, color: colors.foreground, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  controls: { marginTop: 8, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  controlText: { color: colors.foreground, fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 22, marginTop: 10 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  launchBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.background },
  play: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 56, paddingHorizontal: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playText: { color: colors.background, fontFamily: fonts.extraBold, fontSize: 15, letterSpacing: 1.4 },
  playArrow: { color: colors.background, fontFamily: fonts.extraBold, fontSize: 28 },
  pressed: { opacity: 0.8 },
  unavailable: { alignItems: 'center', paddingVertical: 8 },
  unavailableTitle: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2 },
  unavailableText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },
  notFound: { flex: 1, justifyContent: 'center', padding: 24, gap: 24 },
});
