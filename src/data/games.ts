import chickenHopImg from "@/assets/chicken-hop.png";
import hunterGuyImg from "@/assets/hunter-guy.png";
import { withBasePath } from "@/lib/app-base";

export interface Game {
  id: string;
  title: string;
  image: string;
  color: string;
  level: string;
  url: string;
}

export const games: Game[] = [
  {
    id: "chicken-hop",
    title: "Chicken Hop",
    image: chickenHopImg,
    color: "#FF4B4B",
    level: "Level 01",
    url: withBasePath("/games/chicken-hop/"),
  },
  {
    id: "hunter-guy",
    title: "Hunter Guy",
    image: hunterGuyImg,
    color: "#22C55E",
    level: "Level 02",
    url: withBasePath("/games/hunter-guy/"),
  },
];

export const gamesById: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.id, game]),
);
