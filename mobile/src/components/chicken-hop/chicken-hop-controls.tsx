import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/theme";

interface ChickenHopControlsProps {
  disabled: boolean;
  onJumpChange: (pressed: boolean) => void;
  onLeftChange: (pressed: boolean) => void;
  onRightChange: (pressed: boolean) => void;
  safeBottom?: number;
  safeLeft?: number;
  safeRight?: number;
}

interface HoldButtonProps {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  onChange: (pressed: boolean) => void;
  secondaryLabel?: string;
  variant?: "direction" | "jump";
}

function HoldButton({
  accessibilityLabel,
  disabled,
  label,
  onChange,
  secondaryLabel,
  variant = "direction",
}: HoldButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => onChange(true)}
      onPressOut={() => onChange(false)}
      style={({ pressed }) => [
        styles.button,
        variant === "jump" ? styles.jumpButton : styles.directionButton,
        pressed && styles.pressedButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text style={[styles.buttonLabel, variant === "jump" && styles.jumpLabel]}>{label}</Text>
      {secondaryLabel ? <Text style={styles.secondaryLabel}>{secondaryLabel}</Text> : null}
    </Pressable>
  );
}

export function ChickenHopControls({
  disabled,
  onJumpChange,
  onLeftChange,
  onRightChange,
  safeBottom = 0,
  safeLeft = 0,
  safeRight = 0,
}: ChickenHopControlsProps) {
  return (
    <View
      pointerEvents={disabled ? "none" : "box-none"}
      style={[
        styles.controls,
        {
          bottom: 14 + safeBottom,
          left: 14 + safeLeft,
          right: 14 + safeRight,
        },
      ]}
    >
      <View style={styles.directionGroup}>
        <HoldButton
          accessibilityLabel="Move left"
          disabled={disabled}
          label="←"
          onChange={onLeftChange}
        />
        <HoldButton
          accessibilityLabel="Move right"
          disabled={disabled}
          label="→"
          onChange={onRightChange}
        />
      </View>

      <HoldButton
        accessibilityLabel="Jump. Hold to fly."
        disabled={disabled}
        label="HOP"
        onChange={onJumpChange}
        secondaryLabel="HOLD TO FLY"
        variant="jump"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: "absolute",
    zIndex: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  directionGroup: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(15,11,18,0.76)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  directionButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  jumpButton: {
    width: 102,
    height: 72,
    borderColor: "#FFD166",
    borderRadius: 24,
    backgroundColor: "rgba(255,209,102,0.2)",
  },
  pressedButton: {
    borderColor: "#63F3FF",
    backgroundColor: "rgba(99,243,255,0.24)",
    transform: [{ scale: 0.94 }],
  },
  disabledButton: {
    opacity: 0.35,
  },
  buttonLabel: {
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 31,
    lineHeight: 34,
  },
  jumpLabel: {
    color: "#FFD166",
    fontSize: 21,
    lineHeight: 23,
    letterSpacing: 0.8,
  },
  secondaryLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.62)",
    fontFamily: fonts.bold,
    fontSize: 7,
    letterSpacing: 0.8,
  },
});
