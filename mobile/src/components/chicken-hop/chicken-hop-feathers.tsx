import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  advanceFeatherState,
  createFeatherState,
  featherPose,
} from "@/components/chicken-hop/chicken-hop-feather-model";
import {
  CHICKEN_HOP_WORLD_SCALE,
  type ChickenHopGame,
} from "@/game/chicken-hop/engine";

const worldUnits = (screenPixels: number) =>
  screenPixels / CHICKEN_HOP_WORLD_SCALE;

export function ChickenHopFeathers({ game }: { game: ChickenHopGame }) {
  const [featherState, setFeatherState] = useState(createFeatherState);
  const previousGameRef = useRef(game);

  useEffect(() => {
    const previous = previousGameRef.current;
    previousGameRef.current = game;
    setFeatherState((current) =>
      advanceFeatherState(current, previous, game),
    );
  }, [game]);

  return (
    <>
      {featherState.particles.map((feather) => {
        const pose = featherPose(feather, game.elapsed);

        return (
          <View
            accessible={false}
            key={feather.id}
            style={[
              styles.feather,
              {
                height: feather.size * 0.34,
                left: pose.x - feather.size / 2,
                opacity: pose.opacity,
                top: pose.y - feather.size * 0.17,
                transform: [{ rotate: `${pose.rotation}deg` }],
                width: feather.size,
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  feather: {
    position: "absolute",
    borderWidth: worldUnits(1),
    borderColor: "rgba(20,13,25,0.18)",
    borderRadius: worldUnits(4),
    backgroundColor: "#FFF7EA",
  },
});
