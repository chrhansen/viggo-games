import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChickenHopControls } from "@/components/chicken-hop/chicken-hop-controls";
import { ChickenHopHud } from "@/components/chicken-hop/chicken-hop-hud";
import { ChickenHopOverlay } from "@/components/chicken-hop/chicken-hop-overlay";
import { ChickenHopScene } from "@/components/chicken-hop/chicken-hop-scene";
import { fonts } from "@/constants/theme";
import {
  defaultChickenProfile,
  normalizeChickenName,
  type ChickenProfile,
} from "@/game/chicken-hop/customization";
import {
  advanceChickenHopGame,
  createChickenHopGame,
  resizeChickenHopGame,
  snapshotChickenHopGame,
  startChickenHopRun,
  toggleChickenHopPause,
  type ChickenHopInput,
} from "@/game/chicken-hop/engine";

const createEmptyInput = (): ChickenHopInput => ({ jump: false, left: false, right: false });

export default function ChickenHopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [engine] = useState(() => createChickenHopGame(390, 700, 0x56494747));
  const inputRef = useRef(createEmptyInput());
  const [game, setGame] = useState(() => snapshotChickenHopGame(engine));
  const [profile, setProfile] = useState<ChickenProfile>(defaultChickenProfile);

  const publishGame = useCallback(() => {
    setGame(snapshotChickenHopGame(engine));
  }, [engine]);

  const clearInput = useCallback(() => {
    inputRef.current = createEmptyInput();
  }, []);

  const updateInput = useCallback((key: keyof ChickenHopInput, pressed: boolean) => {
    inputRef.current[key] = pressed;
  }, []);

  const updateProfile = useCallback((changes: Partial<ChickenProfile>) => {
    setProfile((current) => ({ ...current, ...changes }));
  }, []);

  const startRun = useCallback(() => {
    clearInput();
    setProfile((current) => ({
      ...current,
      name: normalizeChickenName(current.name),
    }));
    startChickenHopRun(engine);
    publishGame();
  }, [clearInput, engine, publishGame]);

  const togglePause = useCallback(() => {
    clearInput();
    toggleChickenHopPause(engine);
    publishGame();
  }, [clearInput, engine, publishGame]);

  const handleBack = useCallback(() => {
    clearInput();
    router.back();
  }, [clearInput, router]);

  const handleLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { height, width } = nativeEvent.layout;
      if (width <= 0 || height <= 0) return;
      resizeChickenHopGame(engine, width, height);
      publishGame();
    },
    [engine, publishGame],
  );

  useEffect(() => {
    let frame = 0;
    let previousTime = 0;
    let previousRender = 0;

    const tick = (time: number) => {
      if (previousTime === 0) previousTime = time;
      const dt = (time - previousTime) / 1000;
      previousTime = time;
      const wasPlaying = engine.mode === "playing";
      advanceChickenHopGame(engine, inputRef.current, dt);

      if (wasPlaying && time - previousRender >= 1000 / 30) {
        publishGame();
        previousRender = time;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, publishGame]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && engine.mode === "playing") {
        clearInput();
        toggleChickenHopPause(engine);
        publishGame();
      }
    });

    return () => subscription.remove();
  }, [clearInput, engine, publishGame]);

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      <View
        style={[
          styles.toolbar,
          {
            paddingLeft: 10 + insets.left,
            paddingRight: 10 + insets.right,
            paddingTop: 5 + insets.top,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Back to game selector"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleBack}
          style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressedButton]}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={styles.titleGroup}>
          <Text style={styles.level}>LEVEL 01</Text>
          <Text style={styles.title}>CHICKEN HOP</Text>
        </View>

        <View style={styles.toolbarActions}>
          {game.mode === "playing" || game.mode === "paused" ? (
            <Pressable
              accessibilityLabel={game.mode === "paused" ? "Resume run" : "Pause run"}
              accessibilityRole="button"
              hitSlop={6}
              onPress={togglePause}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.textButtonLabel}>{game.mode === "paused" ? "PLAY" : "PAUSE"}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel="Restart run"
            accessibilityRole="button"
            hitSlop={6}
            onPress={startRun}
            style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressedButton]}
          >
            <Text style={styles.restartIcon}>↻</Text>
          </Pressable>
        </View>
      </View>

      <View onLayout={handleLayout} style={styles.gameFrame}>
        <ChickenHopScene game={game} profile={profile} />
        <ChickenHopHud game={game} safeLeft={insets.left} safeRight={insets.right} />
        <ChickenHopControls
          disabled={game.mode !== "playing"}
          onJumpChange={(pressed) => updateInput("jump", pressed)}
          onLeftChange={(pressed) => updateInput("left", pressed)}
          onRightChange={(pressed) => updateInput("right", pressed)}
          safeBottom={insets.bottom}
          safeLeft={insets.left}
          safeRight={insets.right}
        />
        <ChickenHopOverlay
          game={game}
          onProfileChange={updateProfile}
          onRestart={startRun}
          onResume={togglePause}
          onStart={startRun}
          profile={profile}
          safeBottom={insets.bottom}
          safeLeft={insets.left}
          safeRight={insets.right}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#100B13",
  },
  toolbar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#100B13",
  },
  toolbarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backIcon: {
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 26,
  },
  restartIcon: {
    color: "#FFD166",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 26,
  },
  titleGroup: {
    flex: 1,
    marginHorizontal: 11,
  },
  level: {
    color: "#63F3FF",
    fontFamily: fonts.bold,
    fontSize: 7,
    letterSpacing: 1.5,
  },
  title: {
    color: "#FFF8E9",
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.35,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  textButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  textButtonLabel: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  gameFrame: {
    flex: 1,
    minHeight: 280,
    overflow: "hidden",
    backgroundColor: "#34251F",
  },
  pressedButton: {
    opacity: 0.66,
    transform: [{ scale: 0.96 }],
  },
});
