import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import about from '../../../src/data/about.json';
import portrait from '../../../src/assets/viggo-portrait.webp';

export default function AboutScreen() {
  const router = useRouter();
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return <SafeAreaView style={styles.screen}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to games" onPress={back} style={styles.back}>
          <Text style={styles.backText}>← BACK TO GAMES</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{about.title}</Text>
        <Image source={portrait} accessibilityLabel={about.portraitAlt} contentFit="cover" style={styles.portrait} />
        <Text style={styles.body}><Text style={styles.brand}>VIGGO.GAMES</Text> {about.intro}</Text>
        <Text style={styles.body}>{about.story}</Text>
        <Text style={styles.body}>{about.sourceIntro}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel={about.sourceLabel}
          onPress={() => Linking.openURL(about.sourceUrl)}
          style={({ pressed }) => [styles.source, pressed && styles.pressed]}>
          <Text style={styles.sourceText}>{about.sourceLabel}</Text>
        </Pressable>
        <Text style={styles.footer}>{about.footer.toUpperCase()}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  back: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.yellow },
  backText: { color: colors.yellow, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  title: { color: colors.yellow, fontFamily: fonts.extraBold, fontSize: 40, lineHeight: 44, letterSpacing: -1.6, marginTop: 32, marginBottom: 24 },
  portrait: { width: 128, height: 128, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  body: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 17, lineHeight: 27, marginTop: 24 },
  brand: { color: colors.yellow, fontFamily: fonts.bold },
  source: { minHeight: 48, justifyContent: 'center', marginTop: 16, padding: 16, backgroundColor: colors.surface, borderRadius: 12 },
  sourceText: { color: colors.cyan, fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 22, textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  footer: { color: colors.muted, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 2, marginTop: 48 },
});
