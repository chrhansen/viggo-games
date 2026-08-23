import { StyleSheet, View } from "react-native";

interface CornKernelProps {
  gold?: boolean;
  radius: number;
  rotation?: number;
}

export function CornKernel({ gold = false, radius, rotation = 0 }: CornKernelProps) {
  const width = radius * 1.8;
  const height = radius * 1.4;
  const dotSize = Math.max(1.5, radius * 0.12);

  return (
    <View
      accessibilityLabel={gold ? "Golden corn kernel" : "Corn kernel"}
      style={[styles.glow, { height: radius * 2.8, width: radius * 2.8 }]}
    >
      <View
        style={[
          styles.kernel,
          {
            width,
            height,
            borderRadius: radius * 0.6,
            backgroundColor: gold ? "#FFDF7A" : "#FFD166",
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.highlight,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                left: radius * (0.34 + index * 0.18),
                top: radius * (0.42 + (index % 2) * 0.12),
              },
            ]}
          />
        ))}
      </View>

      {gold ? (
        <View style={[styles.sparkle, { top: radius * 0.08 }]}>
          <View style={[styles.sparkleVertical, { height: radius * 0.5 }]} />
          <View style={[styles.sparkleHorizontal, { width: radius * 0.5 }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,214,102,0.10)",
    shadowColor: "#FFD166",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  kernel: {
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255,247,234,0.48)",
  },
  sparkle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleVertical: {
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  sparkleHorizontal: {
    position: "absolute",
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
});
