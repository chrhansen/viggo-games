import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/theme";
import type { ChickenHopGame } from "@/game/chicken-hop/engine";
import {
  getChickenPalette,
  type ChickenProfile,
} from "@/game/chicken-hop/customization";

interface ChickenAvatarProps {
  game: ChickenHopGame;
  profile: ChickenProfile;
}

const spriteWidth = 46;
const spriteHeight = 38;

interface ChickenSpriteProps {
  profile: ChickenProfile;
  scale?: number;
  tilt?: number;
  wingTilt?: number;
}

export function ChickenSprite({
  profile,
  scale = 1,
  tilt = 0,
  wingTilt = 0,
}: ChickenSpriteProps) {
  const palette = getChickenPalette(profile.color);
  const isFlame = profile.design === "flame";
  const left = -((spriteWidth - spriteWidth * scale) / 2);
  const top = -((spriteHeight - spriteHeight * scale) / 2);

  return (
    <View
      style={[
        styles.sprite,
        {
          left,
          top,
          transform: [{ scale }, { rotate: `${tilt}deg` }],
        },
      ]}
    >
      <View
        style={[
          styles.tailTop,
          { backgroundColor: isFlame ? "#FF6A3D" : palette.body },
        ]}
      />
      <View
        style={[
          styles.tailBottom,
          { backgroundColor: isFlame ? "#FFD166" : palette.wing },
        ]}
      />

      <View style={styles.leftLeg} />
      <View style={styles.rightLeg} />

      <View
        style={[
          styles.body,
          { backgroundColor: palette.body, borderColor: palette.ink },
        ]}
      >
        <View style={styles.bellyShade} />
        {profile.design === "spots" ? (
          <>
            <View style={[styles.spot, styles.spotOne]} />
            <View style={[styles.spot, styles.spotTwo]} />
            <View style={[styles.spot, styles.spotThree]} />
            <View style={[styles.spot, styles.spotFour]} />
          </>
        ) : null}
        {profile.design === "flame" ? <View style={styles.flameWash} /> : null}
        {profile.design === "robot" ? (
          <>
            <View style={styles.robotShine} />
            <View style={[styles.robotLine, styles.robotLineTop]} />
            <View style={[styles.robotLine, styles.robotLineBottom]} />
          </>
        ) : null}
      </View>

      <View
        style={[
          styles.wing,
          {
            backgroundColor: palette.wing,
            borderColor: palette.ink,
            transform: [{ rotate: `${wingTilt}deg` }],
          },
        ]}
      />
      <View
        style={[
          styles.head,
          { backgroundColor: palette.body, borderColor: palette.ink },
        ]}
      />
      <View style={styles.combLeft} />
      <View style={styles.combRight} />
      <View style={[styles.eye, profile.design === "robot" && styles.robotEye]} />
      <View style={styles.beak} />
    </View>
  );
}

export function ChickenPreview({ profile }: { profile: ChickenProfile }) {
  return (
    <View accessibilityLabel={`${profile.name} preview`} style={styles.preview}>
      <ChickenSprite profile={profile} wingTilt={-8} />
    </View>
  );
}

export function ChickenAvatar({ game, profile }: ChickenAvatarProps) {
  const { player } = game;
  const airborneTilt = Math.max(-12, Math.min(10, player.vy / 55));
  const runningTilt = Math.sin(game.elapsed * 18) * 2;
  const tilt = player.onGround ? runningTilt : airborneTilt;
  const wingTilt = player.onGround
    ? Math.sin(game.elapsed * 20) * 10
    : Math.sin(game.elapsed * 26) * 24;
  const blink = player.invulnerableFor > 0 && Math.floor(game.elapsed * 16) % 2 === 0;
  const spriteScale = Math.min(
    player.width / spriteWidth,
    player.height / spriteHeight,
  );

  return (
    <View
      accessibilityLabel={`${profile.name} the chicken`}
      style={[
        styles.avatar,
        {
          height: player.height,
          left: player.x,
          opacity: blink ? 0.45 : 1,
          top: player.y,
          width: player.width,
        },
      ]}
    >
      <View style={[styles.nameTagWrap, { bottom: player.height + 4 }]}>
        <Text numberOfLines={1} style={styles.nameTag}>
          {profile.name}
        </Text>
      </View>
      <ChickenSprite
        profile={profile}
        scale={spriteScale}
        tilt={tilt}
        wingTilt={wingTilt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: "absolute",
  },
  sprite: {
    position: "absolute",
    top: 0,
    left: 0,
    width: spriteWidth,
    height: spriteHeight,
  },
  preview: {
    width: 52,
    height: 42,
    marginRight: 4,
  },
  nameTagWrap: {
    position: "absolute",
    left: -32,
    width: 110,
    alignItems: "center",
  },
  nameTag: {
    maxWidth: 108,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    color: "#FFF7EA",
    backgroundColor: "rgba(18,16,36,0.72)",
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
    textAlign: "center",
  },
  tailTop: {
    position: "absolute",
    left: -2,
    top: 13,
    width: 15,
    height: 9,
    borderRadius: 8,
    transform: [{ rotate: "-24deg" }],
  },
  tailBottom: {
    position: "absolute",
    left: -2,
    top: 21,
    width: 14,
    height: 8,
    borderRadius: 8,
    transform: [{ rotate: "20deg" }],
  },
  body: {
    position: "absolute",
    left: 3,
    top: 9,
    width: 34,
    height: 24,
    overflow: "hidden",
    borderRadius: 17,
    borderWidth: 1.5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  bellyShade: {
    position: "absolute",
    right: -2,
    bottom: -5,
    width: 28,
    height: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,106,61,0.10)",
  },
  wing: {
    position: "absolute",
    left: 8,
    top: 17,
    width: 20,
    height: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  head: {
    position: "absolute",
    right: 0,
    top: 4,
    width: 19,
    height: 18,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  combLeft: {
    position: "absolute",
    right: 10,
    top: -1,
    width: 7,
    height: 9,
    borderRadius: 6,
    backgroundColor: "#FF4B3A",
  },
  combRight: {
    position: "absolute",
    right: 4,
    top: 0,
    width: 7,
    height: 9,
    borderRadius: 6,
    backgroundColor: "#FF4B3A",
  },
  eye: {
    position: "absolute",
    right: 6,
    top: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  robotEye: {
    backgroundColor: "#4CC9F0",
    shadowColor: "#4CC9F0",
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  beak: {
    position: "absolute",
    right: -7,
    top: 12,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFD166",
  },
  leftLeg: {
    position: "absolute",
    left: 14,
    top: 30,
    width: 2.5,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#FFD166",
  },
  rightLeg: {
    position: "absolute",
    left: 24,
    top: 30,
    width: 2.5,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#FFD166",
  },
  spot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  spotOne: { left: 7, top: 5 },
  spotTwo: { left: 16, top: 3 },
  spotThree: { left: 12, top: 13 },
  spotFour: { left: 23, top: 11 },
  flameWash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "68%",
    backgroundColor: "rgba(255,76,48,0.34)",
    transform: [{ skewX: "-18deg" }],
  },
  robotShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  robotLine: {
    position: "absolute",
    left: 7,
    right: 6,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  robotLineTop: { top: 8 },
  robotLineBottom: { top: 15 },
});
