import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

const verticalLines = ["8%", "25%", "42%", "59%", "76%", "93%"] as const;
const horizontalLines = ["12%", "32%", "52%", "72%", "92%"] as const;

export function ArcadeBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.cyanGlow} />
      <View style={styles.yellowGlow} />
      <View style={styles.arc} />

      {verticalLines.map((left) => (
        <View key={left} style={[styles.verticalLine, { left }]} />
      ))}

      {horizontalLines.map((top) => (
        <View key={top} style={[styles.horizontalLine, { top }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cyanGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99, 243, 255, 0.09)",
    right: -190,
    top: 120,
  },
  yellowGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 214, 10, 0.08)",
    left: -150,
    bottom: 80,
  },
  arc: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.11)",
    right: -290,
    top: -170,
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  horizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
});
