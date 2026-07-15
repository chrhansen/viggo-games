import { StyleSheet, Text, View } from "react-native";

import { CornKernel } from "@/components/chicken-hop/corn-kernel";
import { fonts } from "@/constants/theme";
import type { ChickenHopGame } from "@/game/chicken-hop/engine";

interface ChickenHopHudProps {
  game: ChickenHopGame;
  safeLeft?: number;
  safeRight?: number;
}

function HeartMeter({ index, value }: { index: number; value: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`Heart ${index + 1}, ${Math.round(value)} percent`}
      style={[styles.heart, value === 0 && styles.emptyHeart]}
    >
      <Text style={styles.heartIcon}>♥</Text>
      <View style={styles.heartTrack}>
        <View style={[styles.heartFill, { width: 40 * (value / 100) }]} />
      </View>
    </View>
  );
}

export function ChickenHopHud({ game, safeLeft = 0, safeRight = 0 }: ChickenHopHudProps) {
  const fuelRatio = game.flyFuel / game.flyFuelMax;

  return (
    <View
      pointerEvents="none"
      style={[styles.hud, { left: 12 + safeLeft, right: 12 + safeRight }]}
    >
      <View style={styles.topRow}>
        <View style={styles.healthCard}>
          {game.hearts.map((value, index) => (
            <HeartMeter index={index} key={index} value={value} />
          ))}
        </View>

        <View
          accessible
          accessibilityLabel={`Score ${Math.floor(game.score)}. Best ${game.best}. Corn ${game.corn}.`}
          style={styles.scoreCard}
        >
          <View style={styles.stat}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{Math.floor(game.score).toString().padStart(5, "0")}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>BEST</Text>
            <Text style={styles.statValue}>{game.best.toString().padStart(5, "0")}</Text>
          </View>
          <View style={styles.cornBadge}>
            <CornKernel radius={6.5} />
            <Text style={styles.cornValue}>{game.corn}</Text>
          </View>
        </View>
      </View>

      <View
        accessible
        accessibilityLabel={`${game.flyFuel.toFixed(1)} seconds of flight fuel`}
        style={styles.fuelCard}
      >
        <Text style={styles.fuelLabel}>FLIGHT</Text>
        <View style={styles.fuelTrack}>
          <View style={[styles.fuelFill, { width: 94 * fuelRatio }]} />
        </View>
        <Text style={styles.fuelValue}>{game.flyFuel.toFixed(1)}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    top: 12,
    zIndex: 5,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  healthCard: {
    gap: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    backgroundColor: "rgba(12,9,16,0.76)",
  },
  heart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  emptyHeart: {
    opacity: 0.35,
  },
  heartIcon: {
    width: 16,
    color: "#FF5364",
    fontSize: 17,
    lineHeight: 18,
  },
  heartTrack: {
    width: 40,
    height: 7,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  heartFill: {
    height: 7,
    borderRadius: 6,
    backgroundColor: "#FF5364",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 54,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    backgroundColor: "rgba(12,9,16,0.76)",
  },
  stat: {
    alignItems: "flex-end",
  },
  statLabel: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: fonts.bold,
    fontSize: 7,
    letterSpacing: 1.1,
  },
  statValue: {
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cornBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(255,209,102,0.16)",
  },
  cornValue: {
    minWidth: 13,
    color: "#FFD166",
    fontFamily: fonts.extraBold,
    fontSize: 14,
    textAlign: "center",
  },
  fuelCard: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(99,243,255,0.2)",
    borderRadius: 10,
    backgroundColor: "rgba(12,9,16,0.72)",
  },
  fuelLabel: {
    color: "#63F3FF",
    fontFamily: fonts.bold,
    fontSize: 7,
    letterSpacing: 1,
  },
  fuelTrack: {
    width: 94,
    height: 6,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "rgba(99,243,255,0.12)",
  },
  fuelFill: {
    height: 6,
    borderRadius: 5,
    backgroundColor: "#63F3FF",
  },
  fuelValue: {
    width: 27,
    color: "#FFF8E9",
    fontFamily: fonts.bold,
    fontSize: 9,
    textAlign: "right",
  },
});
