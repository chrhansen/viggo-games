import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArcadeBackdrop } from "@/components/arcade-backdrop";
import { MissionCard } from "@/components/mission-card";
import { colors, fonts } from "@/constants/theme";
import { gamePreviews } from "@/data/games";

const configuredBuild =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.buildNumber
    : Constants.expoConfig?.android?.versionCode;
const buildLabel = configuredBuild
  ? `BUILD ${String(configuredBuild).padStart(3, "0")}`
  : "DEVELOPMENT BUILD";

export default function GameSelectorScreen() {
  const router = useRouter();
  const [viewport, setViewport] = useState({ height: 0, width: 0 });
  const isLandscape = viewport.width > viewport.height;
  const [revealValues] = useState(() =>
    Array.from({ length: gamePreviews.length + 1 }, () => new Animated.Value(0)),
  );

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { height, width } = nativeEvent.layout;

    setViewport((current) =>
      current.height === height && current.width === width ? current : { height, width },
    );
  };

  useEffect(() => {
    const reveal = Animated.stagger(
      85,
      revealValues.map((value) =>
        Animated.timing(value, {
          duration: 430,
          toValue: 1,
          useNativeDriver: true,
        }),
      ),
    );

    reveal.start();
    return () => reveal.stop();
  }, [revealValues]);

  const headerTranslateY = revealValues[0].interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  return (
    <SafeAreaView onLayout={handleLayout} style={styles.screen}>
      <StatusBar style="light" />
      <ArcadeBackdrop />

      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.layout, isLandscape && styles.layoutLandscape]}>
          <Animated.View
            style={[
              styles.header,
              isLandscape && styles.headerLandscape,
              {
                opacity: revealValues[0],
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <View style={styles.systemRow}>
              <View style={styles.systemLabel}>
                <View style={styles.onlineDot} />
                <Text style={styles.systemText}>MOBILE ARCADE ONLINE</Text>
              </View>
              <Text style={styles.buildText}>{buildLabel}</Text>
            </View>

            <Text
              accessibilityRole="header"
              style={[styles.brand, isLandscape && styles.brandLandscape]}
            >
              VIGGO{isLandscape ? "\n" : ""}
              <Text style={styles.brandAccent}>.GAMES</Text>
            </Text>
            <Text style={styles.kicker}>SELECT YOUR MISSION</Text>
            <Text style={styles.intro}>
              The doors are open. Chicken Hop and Hunter Guy are ready to play.
            </Text>

            <View style={styles.coinSlot}>
              <View style={styles.coinSlotLine} />
              <Text style={styles.coinSlotText}>INSERT IMAGINATION</Text>
              <View style={styles.coinSlotLine} />
            </View>
          </Animated.View>

          <View style={[styles.missionList, isLandscape && styles.missionListLandscape]}>
            {gamePreviews.map((mission, index) => (
              <MissionCard
                animation={revealValues[index + 1]}
                featured={index === 0}
                key={mission.id}
                mission={mission}
                onPress={
                  mission.route ? () => router.push(mission.route!) : undefined
                }
              />
            ))}

            <Text style={styles.footer}>2 GAMES READY · MORE MISSIONS IN DEVELOPMENT</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  scrollContentLandscape: {
    paddingHorizontal: 30,
    paddingTop: 16,
  },
  layout: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  layoutLandscape: {
    maxWidth: 1100,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 34,
  },
  header: {
    marginBottom: 24,
  },
  headerLandscape: {
    flex: 0.78,
    paddingTop: 12,
  },
  systemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  systemLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  systemText: {
    color: colors.green,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  buildText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  brand: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 53,
    letterSpacing: -3.2,
    lineHeight: 57,
  },
  brandAccent: {
    color: colors.yellow,
  },
  brandLandscape: {
    fontSize: 46,
    letterSpacing: -2.8,
    lineHeight: 47,
  },
  kicker: {
    marginTop: 14,
    color: colors.cyan,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 3.2,
  },
  intro: {
    maxWidth: 480,
    marginTop: 12,
    color: "rgba(248, 247, 242, 0.72)",
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
  },
  coinSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
  },
  coinSlotLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 214, 10, 0.32)",
  },
  coinSlotText: {
    color: colors.yellow,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  missionList: {
    gap: 13,
  },
  missionListLandscape: {
    flex: 1.22,
  },
  footer: {
    marginTop: 12,
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textAlign: "center",
  },
});
