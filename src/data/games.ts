import burbImg from "@/assets/burb.png";
import chickenHopImg from "@/assets/chicken-hop.png";
import gunnyImg from "@/assets/gunny.png";
import hunterGuyImg from "@/assets/hunter-guy.png";
import { withBasePath } from "@/lib/app-base";
import gameRecords from "./games.json";

export interface Game {
  id: string;
  title: string;
  image: string;
  imageFile: string;
  color: string;
  level: string;
  url: string;
  urlPath: string;
  routePath: string;
  tagline: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  controls: string[];
  genre: string;
}

const gameImages: Record<string, string> = {
  "burb.png": burbImg,
  "chicken-hop.png": chickenHopImg,
  "gunny.png": gunnyImg,
  "hunter-guy.png": hunterGuyImg,
};

export const games: Game[] = gameRecords.map((game) => ({
  ...game,
  image: gameImages[game.imageFile],
  url: withBasePath(game.urlPath),
}));

export const gamesById: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.id, game]),
);
