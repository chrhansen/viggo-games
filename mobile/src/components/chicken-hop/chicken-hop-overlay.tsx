import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChickenHopStartCard } from "@/components/chicken-hop/chicken-hop-start-card";
import { fonts } from "@/constants/theme";
import type { ChickenProfile } from "@/game/chicken-hop/customization";
import type { ChickenHopGame } from "@/game/chicken-hop/engine";

interface ChickenHopOverlayProps {
  game: ChickenHopGame;
  onProfileChange: (changes: Partial<ChickenProfile>) => void;
  onRestart: () => void;
  onResume: () => void;
  onStart: () => void;
  profile: ChickenProfile;
  safeBottom?: number;
  safeLeft?: number;
  safeRight?: number;
}

export function ChickenHopOverlay({
  game,
  onProfileChange,
  onRestart,
  onResume,
  onStart,
  profile,
  safeBottom = 0,
  safeLeft = 0,
  safeRight = 0,
}: ChickenHopOverlayProps) {
  if (game.mode === "playing") return null;

  const isReady = game.mode === "ready";
  if (isReady) {
    return (
      <ChickenHopStartCard
        height={game.height}
        onProfileChange={onProfileChange}
        onStart={onStart}
        profile={profile}
        safeBottom={safeBottom}
        safeLeft={safeLeft}
        safeRight={safeRight}
        width={game.width}
      />
    );
  }

  const isPaused = game.mode === "paused";
  const title = isPaused ? "RUN PAUSED" : "FEATHERS EVERYWHERE";
  const body = isPaused
    ? `${profile.name} is holding position.`
    : `${profile.name} scored ${Math.floor(game.score)} and grabbed ${game.corn} corn.`;
  const action = isPaused ? onResume : onRestart;
  const actionLabel = isPaused ? "KEEP HOPPING" : "TRY AGAIN";

  return (
    <View accessibilityViewIsModal style={styles.overlay}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrow}>HOUSE RUN</Text>
          <View style={styles.eyebrowLine} />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.body}>{body}</Text>

        {game.mode === "gameover" ? (
          <View style={styles.resultRow}>
            <View style={styles.result}>
              <Text style={styles.resultLabel}>BEST</Text>
              <Text style={styles.resultValue}>{game.best}</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.result}>
              <Text style={styles.resultLabel}>CORN</Text>
              <Text style={styles.resultValue}>{game.corn}</Text>
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          onPress={action}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton]}
        >
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </Pressable>

        {isPaused ? (
          <Pressable
            accessibilityLabel="Restart run"
            accessibilityRole="button"
            onPress={onRestart}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
          >
            <Text style={styles.secondaryButtonText}>RESTART RUN</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(10,7,13,0.7)",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,209,102,0.1)",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderWidth: 2,
    borderColor: "rgba(255,209,102,0.46)",
    borderRadius: 28,
    backgroundColor: "rgba(28,18,24,0.96)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 14,
  },
  eyebrowRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eyebrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,209,102,0.26)",
  },
  eyebrow: {
    color: "#FFD166",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2.1,
  },
  title: {
    marginTop: 15,
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 32,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  body: {
    maxWidth: 320,
    marginTop: 6,
    color: "rgba(255,248,233,0.72)",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 18,
  },
  result: {
    alignItems: "center",
  },
  resultDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  resultLabel: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  resultValue: {
    color: "#FFD166",
    fontFamily: fonts.extraBold,
    fontSize: 21,
  },
  primaryButton: {
    minWidth: 190,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 24,
    borderRadius: 17,
    backgroundColor: "#FFD166",
  },
  primaryButtonText: {
    color: "#241817",
    fontFamily: fonts.extraBold,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  secondaryButton: {
    minHeight: 42,
    justifyContent: "center",
    marginTop: 7,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.64)",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  pressedButton: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
});
