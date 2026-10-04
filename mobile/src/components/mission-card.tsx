import { Image } from "expo-image";
import { Animated, Image as NativeImage, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/constants/theme";
import type { GamePreview } from "@/data/games";

interface MissionCardProps {
  animation: Animated.Value;
  mission: GamePreview;
  onPress?: () => void;
}

export function MissionCard({ animation, mission, onPress }: MissionCardProps) {
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const { width, height } = NativeImage.resolveAssetSource(mission.image);
  const disabled = !onPress;

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        accessibilityLabel={`${mission.title}. ${mission.genre}. View game details.`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { aspectRatio: width / height },
          { borderColor: mission.color },
          pressed && styles.pressedCard,
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${mission.title} artwork`}
          contentFit="contain"
          source={mission.image}
          style={StyleSheet.absoluteFill}
          transition={250}
        />
        {mission.status === "locked" && (
          <View style={[styles.statusChip, { borderColor: mission.color }]}>
            <Text style={styles.statusText}>Coming Soon</Text>
          </View>
        )}
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
  pressedCard: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  statusChip: {
    position: "absolute",
    bottom: 12,
    right: 12,
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
});
