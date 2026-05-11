import burbImg from "@/assets/burb.png";
import chickenHopImg from "@/assets/chicken-hop.png";
import gunnyImg from "@/assets/gunny.png";
import hunterGuyImg from "@/assets/hunter-guy.png";
import { withBasePath } from "@/lib/app-base";

export interface Game {
  id: string;
  title: string;
  image: string;
  color: string;
  level: string;
  url: string;
  tagline: string;
}

export const games: Game[] = [
  {
    id: "chicken-hop",
    title: "Chicken Hop",
    image: chickenHopImg,
    color: "#FF4B4B",
    level: "Level 01",
    url: withBasePath("/games/chicken-hop/"),
    tagline: "Why did the chicken hop the road? To get to the other slide!",
  },
  {
    id: "hunter-guy",
    title: "Hunter Guy",
    image: hunterGuyImg,
    color: "#22C55E",
    level: "Level 02",
    url: withBasePath("/games/hunter-guy/"),
    tagline: "What did the hunter say to his snack? Nice to meat you!",
  },
  {
    id: "burb",
    title: "Burb",
    image: burbImg,
    color: "#FF7A99",
    level: "Level 03",
    url: withBasePath("/games/burb/"),
    tagline: "A small bird, a big road, and very serious steering.",
  },
  {
    id: "gunny",
    title: "Gunny",
    image: gunnyImg,
    color: "#7AF6FF",
    level: "Level 04",
    url: withBasePath("/games/gunny/"),
    tagline: "Space is loud. Your blaster is louder.",
  },
];

export const gamesById: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.id, game]),
);
