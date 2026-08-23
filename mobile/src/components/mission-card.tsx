import { Image } from "expo-image";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { GamePreview } from "@/data/games";

interface MissionCardProps {
  animation: Animated.Value;
  featured?: boolean;
  mission: GamePreview;
  onPress?: () => void;
}

export function MissionCard({ animation, featured = false, mission, onPress }: MissionCardProps) {
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const statusLabel = mission.status === "ready" ? "Play now" : "Locked";
  const disabled = !onPress;

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        accessibilityLabel={`${mission.title}. ${mission.genre}. ${disabled ? "Coming soon" : "Play now"}.`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          featured ? styles.featuredCard : styles.standardCard,
          { borderColor: mission.color },
          pressed && styles.pressedCard,
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${mission.title} artwork`}
          contentFit="cover"
          source={mission.image}
          style={StyleSheet.absoluteFill}
          transition={250}
        />
        <View style={[StyleSheet.absoluteFill, featured ? styles.featuredShade : styles.standardShade]} />
        <View style={[styles.colorRail, { backgroundColor: mission.color }]} />

        <View style={[styles.content, !featured && styles.standardContent]}>
          <View style={styles.metaRow}>
            <Text style={[styles.level, { color: mission.color }]}>LEVEL {mission.level}</Text>
            <View style={[styles.statusChip, { borderColor: mission.color }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={[styles.title, featured && styles.featuredTitle]}>{mission.title}</Text>
          <Text numberOfLines={featured ? 2 : 1} style={styles.tagline}>
            {mission.tagline}
          </Text>
          <Text style={styles.genre}>{mission.genre}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 8,
  },
  featuredCard: {
    minHeight: 196,
  },
  standardCard: {
    minHeight: 122,
  },
  pressedCard: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  featuredShade: {
    backgroundColor: "rgba(9, 11, 24, 0.48)",
  },
  standardShade: {
    backgroundColor: "rgba(9, 11, 24, 0.68)",
  },
  colorRail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 5,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingLeft: 23,
  },
  standardContent: {
    justifyContent: "center",
    width: "72%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 8,
  },
  level: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "rgba(9, 11, 24, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: colors.foreground,
    fontFamily: fonts.semiBold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    letterSpacing: -0.8,
  },
  featuredTitle: {
    fontSize: 36,
    letterSpacing: -1.4,
  },
  tagline: {
    maxWidth: 280,
    marginTop: 3,
    color: "rgba(248, 247, 242, 0.86)",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  genre: {
    marginTop: 9,
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
