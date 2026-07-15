import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ChickenPreview } from "@/components/chicken-hop/chicken-avatar";
import { fonts } from "@/constants/theme";
import {
  chickenColors,
  chickenDesigns,
  normalizeChickenName,
  randomChickenName,
  type ChickenProfile,
} from "@/game/chicken-hop/customization";

interface ChickenHopStartCardProps {
  height: number;
  onProfileChange: (changes: Partial<ChickenProfile>) => void;
  onStart: () => void;
  profile: ChickenProfile;
  safeBottom?: number;
  safeLeft?: number;
  safeRight?: number;
  width: number;
}

const touchRules = [
  ["MOVE", "Hold ← or →"],
  ["JUMP", "Tap HOP"],
  ["FLY", "Hold HOP · 5 seconds"],
  ["PAUSE", "Pause or restart · top bar"],
] as const;

export function ChickenHopStartCard({
  height,
  onProfileChange,
  onStart,
  profile,
  safeBottom = 0,
  safeLeft = 0,
  safeRight = 0,
  width,
}: ChickenHopStartCardProps) {
  const landscape = width > height;

  return (
    <View accessibilityViewIsModal style={styles.overlay}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 10 + safeBottom,
            paddingLeft: (landscape ? 12 : 16) + safeLeft,
            paddingRight: (landscape ? 12 : 16) + safeRight,
            paddingTop: 10,
          },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={[styles.card, landscape && styles.cardLandscape]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>LEVEL 01 · HOUSE RUN</Text>
              <Text accessibilityRole="header" style={[styles.title, landscape && styles.titleLandscape]}>
                CHICKEN HOP
              </Text>
              <Text style={[styles.subtitle, landscape && styles.subtitleLandscape]}>
                Run inside the house. Jump the clutter. Grab the corn.
              </Text>
            </View>
            <ChickenPreview profile={profile} />
          </View>

          <View style={[styles.columns, landscape && styles.columnsLandscape]}>
            <View style={styles.column}>
              <Text style={styles.label}>Name your chicken</Text>
              <View style={styles.nameRow}>
                <TextInput
                  accessibilityLabel="Chicken name"
                  autoCapitalize="words"
                  autoComplete="off"
                  maxLength={14}
                  onChangeText={(name) => onProfileChange({ name })}
                  onEndEditing={() =>
                    onProfileChange({ name: normalizeChickenName(profile.name) })
                  }
                  placeholder="Nugget"
                  placeholderTextColor="rgba(255,247,234,0.48)"
                  selectionColor="#FF6A3D"
                  spellCheck={false}
                  style={styles.nameInput}
                  value={profile.name}
                />
                <Pressable
                  accessibilityLabel="Choose a random chicken name"
                  accessibilityRole="button"
                  onPress={() =>
                    onProfileChange({ name: randomChickenName(profile.name) })
                  }
                  style={({ pressed }) => [
                    styles.randomButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.randomButtonText}>RANDOM</Text>
                </Pressable>
              </View>

              <Text style={[styles.label, styles.sectionLabel]}>Design</Text>
              <View style={styles.designRow}>
                {chickenDesigns.map((design) => {
                  const selected = profile.design === design.id;
                  return (
                    <Pressable
                      accessibilityLabel={`${design.label} chicken design`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={design.id}
                      onPress={() => onProfileChange({ design: design.id })}
                      style={({ pressed }) => [
                        styles.designButton,
                        selected && styles.designButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.designButtonText,
                          selected && styles.designButtonTextSelected,
                        ]}
                      >
                        {design.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, styles.sectionLabel]}>Color</Text>
              <View style={styles.colorRow}>
                {chickenColors.map((color) => {
                  const selected = profile.color === color.id;
                  return (
                    <Pressable
                      accessibilityLabel={`${color.label} chicken color`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={color.id}
                      onPress={() => onProfileChange({ color: color.id })}
                      style={({ pressed }) => [
                        styles.swatchButton,
                        selected && styles.swatchButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[styles.swatch, { backgroundColor: color.swatch }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.column, landscape && styles.rulesColumn]}>
              <View style={styles.rules}>
                {touchRules.map(([label, instruction]) => (
                  <View key={label} style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>{label}</Text>
                    <Text style={styles.ruleText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                accessibilityLabel="Start Chicken Hop"
                accessibilityRole="button"
                onPress={onStart}
                style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
              >
                <Text style={styles.startButtonText}>TAP TO START</Text>
              </Pressable>
              <Text style={styles.tip}>Tip: staying near the middle makes it easier.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: "rgba(10,7,13,0.72)",
  },
  scroll: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 470,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 24,
    backgroundColor: "rgba(43,34,43,0.97)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.48,
    shadowRadius: 24,
    elevation: 14,
  },
  cardLandscape: {
    maxWidth: 760,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#63F3FF",
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 4,
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 31,
    letterSpacing: -1.1,
  },
  titleLandscape: {
    fontSize: 27,
    lineHeight: 29,
  },
  subtitle: {
    marginTop: 3,
    color: "rgba(255,248,233,0.75)",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  subtitleLandscape: {
    fontSize: 12,
    lineHeight: 15,
  },
  columns: {
    marginTop: 16,
    gap: 16,
  },
  columnsLandscape: {
    flexDirection: "row",
    marginTop: 10,
    gap: 18,
  },
  column: {
    flex: 1,
  },
  rulesColumn: {
    justifyContent: "space-between",
  },
  label: {
    color: "#FFF8E9",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionLabel: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 7,
  },
  nameInput: {
    flex: 1,
    minWidth: 120,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 13,
    color: "#FFF8E9",
    backgroundColor: "rgba(18,16,36,0.44)",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  randomButton: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(46,229,157,0.56)",
    borderRadius: 13,
    backgroundColor: "rgba(46,229,157,0.17)",
  },
  randomButtonText: {
    color: "#D9FFF0",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  designRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },
  designButton: {
    minHeight: 35,
    justifyContent: "center",
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.17)",
    borderRadius: 12,
    backgroundColor: "rgba(18,16,36,0.34)",
  },
  designButtonSelected: {
    borderColor: "rgba(255,106,61,0.72)",
    backgroundColor: "rgba(255,106,61,0.20)",
  },
  designButtonText: {
    color: "rgba(255,248,233,0.72)",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  designButtonTextSelected: {
    color: "#FFF8E9",
  },
  colorRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 7,
  },
  swatchButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 17,
  },
  swatchButtonSelected: {
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,106,61,0.24)",
  },
  swatch: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 12,
  },
  rules: {
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 14,
    backgroundColor: "rgba(18,16,36,0.34)",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },
  ruleLabel: {
    width: 56,
    color: "#FFB080",
    fontFamily: fonts.extraBold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  ruleText: {
    flex: 1,
    color: "#FFF8E9",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  startButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#FF8053",
    borderRadius: 14,
    backgroundColor: "rgba(255,106,61,0.23)",
  },
  startButtonText: {
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 1.1,
  },
  tip: {
    marginTop: 7,
    color: "rgba(255,248,233,0.58)",
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
