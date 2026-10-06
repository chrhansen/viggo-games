import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export function AboutLink() {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="About Viggo Games"
    onPress={() => router.push('/about')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
    <Text style={styles.text}>ABOUT VIGGO.GAMES →</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  text: { color: colors.yellow, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4 },
  pressed: { opacity: 0.7 },
});
