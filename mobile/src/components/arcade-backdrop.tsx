import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

export function ArcadeBackdrop() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
    />
  );
}
