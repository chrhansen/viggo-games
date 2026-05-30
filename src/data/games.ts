import burbImg from "@/assets/burb.webp";
import chickenHopImg from "@/assets/chicken-hop.webp";
import gunnyImg from "@/assets/gunny.webp";
import hunterGuyImg from "@/assets/hunter-guy.webp";
import torpedoImg from "@/assets/torpedo.webp";
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
  "burb.webp": burbImg,
  "chicken-hop.webp": chickenHopImg,
  "gunny.webp": gunnyImg,
  "hunter-guy.webp": hunterGuyImg,
  "torpedo.webp": torpedoImg,
};

export const games: Game[] = gameRecords.map((game) => ({
  ...game,
  image: gameImages[game.imageFile],
  url: withBasePath(game.urlPath),
}));

export const gamesById: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.id, game]),
);
