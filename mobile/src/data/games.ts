import burbImage from "../../assets/games/burb.webp";
import chickenHopImage from "../../assets/games/chicken-hop.webp";
import gunnyImage from "../../assets/games/gunny.webp";
import hunterGuyImage from "../../assets/games/hunter-guy.webp";
import torpedoImage from "../../assets/games/torpedo.webp";
import gameContent from "../../../src/data/games.json";

export interface GamePreview {
  id: string;
  level: string;
  title: string;
  tagline: string;
  genre: string;
  color: string;
  image: number;
  status: "ready" | "locked";
  route?: "/chicken-hop" | "/hunter-guy" | "/burb" | "/gunny";
}

export const gamePreviews: readonly GamePreview[] = [
  {
    id: "chicken-hop",
    level: "01",
    title: "Chicken Hop",
    tagline: "A brave chicken. One very busy house.",
    genre: "Arcade runner",
    color: "#FF4B4B",
    image: chickenHopImage,
    status: "ready",
    route: "/chicken-hop",
  },
  {
    id: "hunter-guy",
    level: "02",
    title: "Hunter Guy",
    tagline: "Explore the forest and tag the wildlife.",
    genre: "Forest adventure",
    color: "#22C55E",
    image: hunterGuyImage,
    status: "ready",
    route: "/hunter-guy",
  },
  {
    id: "burb",
    level: "03",
    title: "Burb",
    tagline: "Tiny bird. Winding road. Serious steering.",
    genre: "Cycling game",
    color: "#FF7A99",
    image: burbImage,
    status: "ready",
    route: "/burb",
  },
  {
    id: "gunny",
    level: "04",
    title: "Gunny",
    tagline: "Space is loud. Your blaster is louder.",
    genre: "Space shooter",
    color: "#63F3FF",
    image: gunnyImage,
    status: "ready",
    route: "/gunny",
  },
  {
    id: "torpedo",
    level: "05",
    title: "Torpedo",
    tagline: "Dive deep and keep the hull together.",
    genre: "Submarine combat",
    color: "#8FE7FF",
    image: torpedoImage,
    status: "locked",
  },
];

const touchControls: Record<string, readonly string[]> = {
  'chicken-hop': ['Hold left or right to move.', 'Tap Hop to jump; hold it in the air to fly.'],
  'hunter-guy': ['Left joystick to move; drag the forest to look.', 'Choose a belt tool, aim, then tap Use Tool.'],
  'burb': ['Portrait: hold Left or Right to steer.', 'Landscape: hold the phone upright and twist slightly left or right to steer. Tap Center tilt to recenter.', 'Hold Fast or Slow to change speed; release to cruise.'],
  'gunny': ['Hold the directional buttons to steer left, right, up or down.', 'Hold Fire while steering to blast raiders. Clear 12 raiders and dodge satellites and explosions.'],
};

export const gameDetails = gamePreviews.map((preview) => {
  const content = gameContent.find((game) => game.id === preview.id)!;
  return {
    ...preview,
    description: content.description.replace('browser ', '').replace(' prototype', ''),
    howToPlay: content.howToPlay,
    tips: content.tips
      .filter((tip) => !tip.includes('Down or S') && !(preview.id === 'burb' && tip.includes('enable tilt')))
      .map((tip) => tip.replace('D-pad', 'joystick')),
    touchControls: touchControls[preview.id] ?? [],
  };
});
