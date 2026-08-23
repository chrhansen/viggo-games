import { StyleSheet, Text, View } from "react-native";

import { ChickenAvatar } from "@/components/chicken-hop/chicken-avatar";
import { ChickenHopFeathers } from "@/components/chicken-hop/chicken-hop-feathers";
import { CornKernel } from "@/components/chicken-hop/corn-kernel";
import type { ChickenProfile } from "@/game/chicken-hop/customization";
import {
  CHICKEN_HOP_WORLD_SCALE,
  type ChickenHopGame,
  type ChickenHopObstacle,
} from "@/game/chicken-hop/engine";

interface ChickenHopSceneProps {
  game: ChickenHopGame;
  profile: ChickenProfile;
}

const isPlatform = (obstacle: ChickenHopObstacle) =>
  obstacle.kind === "shelf" || obstacle.kind === "step";

function Obstacle({ obstacle }: { obstacle: ChickenHopObstacle }) {
  if (isPlatform(obstacle)) {
    return (
      <View
        accessibilityLabel={`${obstacle.kind} platform`}
        style={[
          styles.platform,
          {
            height: obstacle.height,
            left: obstacle.x,
            top: obstacle.y,
            width: obstacle.width,
          },
        ]}
      >
        <View
          style={[
            styles.platformShadow,
            { top: obstacle.height + 5 },
          ]}
        />
        <View
          style={[
            styles.platformSurface,
            obstacle.kind === "step"
              ? styles.stepSurface
              : styles.shelfSurface,
          ]}
        >
          <View style={styles.platformTop} />
          {obstacle.kind === "step" ? (
            <>
              <View style={[styles.stepRiser, { left: "34%" }]} />
              <View style={[styles.stepRiser, { left: "68%" }]} />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${obstacle.kind} obstacle`}
      style={[
        styles.obstacle,
        {
          backgroundColor: obstacle.color,
          height: obstacle.height,
          left: obstacle.x,
          top: obstacle.y,
          width: obstacle.width,
        },
      ]}
    >
      {obstacle.kind === "book" ? (
        <>
          <View style={[styles.bookLine, { top: obstacle.height * 0.32 }]} />
          <View style={[styles.bookLine, { top: obstacle.height * 0.64 }]} />
        </>
      ) : (
        <View style={styles.obstacleFace}>
          <View style={styles.obstacleEye} />
          <View style={styles.obstacleEye} />
        </View>
      )}
    </View>
  );
}

export function ChickenHopScene({ game, profile }: ChickenHopSceneProps) {
  const visibleWidth = game.width * CHICKEN_HOP_WORLD_SCALE;
  const visibleHeight = game.height * CHICKEN_HOP_WORLD_SCALE;
  const dotSpacing = 48 / CHICKEN_HOP_WORLD_SCALE;
  const dotColumns = Math.ceil(game.width / dotSpacing) + 2;
  const dotRows = Math.ceil(game.floorY / dotSpacing);
  const wallpaperOffset = -((game.scroll * 0.13) % dotSpacing);
  const floorboardOffset = -((game.scroll * 0.72) % 54);
  const air = Math.max(
    0,
    Math.min(
      1,
      (game.floorY - game.player.y - game.player.height) /
        (120 / CHICKEN_HOP_WORLD_SCALE),
    ),
  );

  return (
    <View pointerEvents="none" style={styles.scene}>
      <View
        style={[
          styles.world,
          {
            height: game.height,
            transform: [{ scale: CHICKEN_HOP_WORLD_SCALE }],
            transformOrigin: "top left",
            width: game.width,
          },
        ]}
      >
        <View style={[styles.wall, { height: game.floorY }]} />

        {Array.from({ length: dotColumns * dotRows }, (_, index) => {
          const column = index % dotColumns;
          const row = Math.floor(index / dotColumns);
          const color = (column + row) % 3 === 0 ? "#FF7A99" : (column + row) % 3 === 1 ? "#63F3FF" : "#FFD166";

          return (
            <View
              key={`dot-${index}`}
              style={[
                styles.wallpaperDot,
                {
                  backgroundColor: color,
                  left: wallpaperOffset + column * dotSpacing,
                  top: 30 + row * dotSpacing,
                },
              ]}
            />
          );
        })}

        <View style={[styles.buntingLine, { top: visibleHeight * 0.07 }]} />
        {Array.from({ length: Math.ceil(game.width / 52) }, (_, index) => (
          <View
            key={`flag-${index}`}
            style={[
              styles.flag,
              {
                borderTopColor: index % 3 === 0 ? "#70E59B" : index % 3 === 1 ? "#FF7A99" : "#FFD60A",
                left: index * 52 + 10,
                top: visibleHeight * 0.07 + 2,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.window,
            {
              height: visibleHeight * 0.16,
              left: visibleWidth * 0.09,
              top: visibleHeight * 0.14,
              width: visibleWidth * 0.2,
            },
          ]}
        >
          <View style={styles.windowVertical} />
          <View style={styles.windowHorizontal} />
        </View>
        <View
          style={[
            styles.window,
            {
              height: visibleHeight * 0.16,
              right: visibleWidth * 0.08,
              top: visibleHeight * 0.14,
              width: visibleWidth * 0.2,
            },
          ]}
        >
          <View style={styles.windowVertical} />
          <View style={styles.windowHorizontal} />
        </View>

        <View style={[styles.pictureFrame, { left: visibleWidth * 0.4, top: visibleHeight * 0.18 }]} />
        <View style={[styles.sofa, { right: visibleWidth * 0.05, top: game.floorY - 58, width: visibleWidth * 0.28 }]} />
        <View style={[styles.lampPole, { left: visibleWidth * 0.14, top: game.floorY - 105 }]} />
        <View style={[styles.lampShade, { left: visibleWidth * 0.14 - 18, top: game.floorY - visibleHeight * 0.15 - 28 }]} />

        <View style={[styles.floor, { top: game.floorY }]}>
          <View style={[styles.rug, { left: visibleWidth * 0.05, width: visibleWidth * 0.9 }]} />
          {Array.from({ length: Math.ceil(game.width / 54) + 2 }, (_, index) => (
            <View key={`board-${index}`} style={[styles.floorboard, { left: floorboardOffset + index * 54 }]} />
          ))}
        </View>
        <View style={[styles.baseboard, { top: game.floorY - 5 }]} />

        {game.obstacles.map((obstacle) => (
          <Obstacle key={obstacle.id} obstacle={obstacle} />
        ))}

        {game.pickups.map((pickup) => (
          <View
            key={pickup.id}
            style={[
              styles.pickup,
              {
                height: pickup.radius * 2.8,
                left: pickup.x - pickup.radius * 1.4,
                top: pickup.y - pickup.radius * 1.4 + Math.sin(pickup.phase) * 5,
                width: pickup.radius * 2.8,
              },
            ]}
          >
            <CornKernel
              gold={pickup.kind === "gold-corn"}
              radius={pickup.radius}
              rotation={Math.sin(pickup.phase) * (pickup.kind === "gold-corn" ? 10 : 14)}
            />
          </View>
        ))}

        {game.eggs.map((egg) => (
          <Text
            accessible={false}
            key={egg.id}
            style={[
              styles.egg,
              {
                fontSize: egg.radius * 2.05,
                left: egg.x - egg.radius,
                top: egg.y - egg.radius,
                transform: [{ rotate: `${Math.sin(egg.phase) * 4}deg` }],
              },
            ]}
          >
            🥚
          </Text>
        ))}

        <View
          style={[
            styles.chickenShadow,
            {
              left: game.player.x + 4,
              opacity: 0.3 - air * 0.18,
              top: game.floorY - 8,
              width: game.player.width - 8,
            },
          ]}
        />
        <ChickenAvatar game={game} profile={profile} />
        <ChickenHopFeathers game={game} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: "#14101B",
  },
  world: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  wall: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#34251F",
  },
  wallpaperDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.18,
  },
  buntingLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  flag: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    opacity: 0.55,
  },
  window: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 12,
    backgroundColor: "#173B4C",
    shadowColor: "#63F3FF",
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  windowVertical: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  windowHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pictureFrame: {
    position: "absolute",
    width: 54,
    height: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 9,
    backgroundColor: "rgba(255,122,153,0.17)",
    transform: [{ rotate: "-3deg" }],
  },
  sofa: {
    position: "absolute",
    height: 58,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "rgba(20,13,25,0.44)",
  },
  lampPole: {
    position: "absolute",
    width: 5,
    height: 105,
    backgroundColor: "rgba(20,13,25,0.56)",
  },
  lampShade: {
    position: "absolute",
    width: 42,
    height: 28,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: "rgba(255,214,102,0.22)",
  },
  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#2A1816",
  },
  rug: {
    position: "absolute",
    top: 18,
    bottom: 18,
    borderWidth: 2,
    borderColor: "rgba(99,243,255,0.14)",
    borderRadius: 16,
    backgroundColor: "rgba(255,122,153,0.1)",
  },
  floorboard: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  baseboard: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  obstacle: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  platform: {
    position: "absolute",
  },
  platformShadow: {
    position: "absolute",
    left: 6,
    right: 6,
    height: 9,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  platformSurface: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  shelfSurface: {
    backgroundColor: "rgba(46,229,157,0.3)",
  },
  stepSurface: {
    backgroundColor: "rgba(46,229,157,0.22)",
  },
  platformTop: {
    height: 10,
    backgroundColor: "rgba(126,240,138,0.42)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  stepRiser: {
    position: "absolute",
    top: 10,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  obstacleFace: {
    position: "absolute",
    top: "40%",
    left: "28%",
    right: "28%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  obstacleEye: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  bookLine: {
    position: "absolute",
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  pickup: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  egg: {
    position: "absolute",
  },
  chickenShadow: {
    position: "absolute",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#000000",
  },
});
