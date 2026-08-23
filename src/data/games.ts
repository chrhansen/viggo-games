import burbImg from "@/assets/burb.webp";
import chickenHopImg from "@/assets/chicken-hop.webp";
import gunnyImg from "@/assets/gunny.webp";
import hunterGuyImg from "@/assets/hunter-guy.webp";
import burbThumbnail from "@/assets/responsive/burb-768.webp";
import chickenHopThumbnail from "@/assets/responsive/chicken-hop-768.webp";
import gunnyThumbnail from "@/assets/responsive/gunny-768.webp";
import hunterGuyThumbnail from "@/assets/responsive/hunter-guy-768.webp";
import torpedoThumbnail from "@/assets/responsive/torpedo-768.webp";
import torpedoImg from "@/assets/torpedo.webp";
import { withBasePath } from "@/lib/app-base";
import gameRecords from "./games.json";

export interface Game {
  id: string;
  title: string;
  image: string;
  thumbnail: string;
  imageFile: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  color: string;
  level: string;
  url: string;
  urlPath: string;
  routePath: string;
  tagline: string;
  description: string;
  metaDescription: string;
  seoTitle: string;
  keywords: string[];
  controls: string[];
  genre: string;
  howToPlay: string[];
  tips: string[];
}

const gameImages: Record<string, string> = {
  "burb.webp": burbImg,
  "chicken-hop.webp": chickenHopImg,
  "gunny.webp": gunnyImg,
  "hunter-guy.webp": hunterGuyImg,
  "torpedo.webp": torpedoImg,
};

const gameThumbnails: Record<string, string> = {
  "burb.webp": burbThumbnail,
  "chicken-hop.webp": chickenHopThumbnail,
  "gunny.webp": gunnyThumbnail,
  "hunter-guy.webp": hunterGuyThumbnail,
  "torpedo.webp": torpedoThumbnail,
};

export const games: Game[] = gameRecords.map((game) => ({
  ...game,
  image: gameImages[game.imageFile],
  thumbnail: gameThumbnails[game.imageFile],
  url: withBasePath(game.urlPath),
}));

export const gamesById: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.id, game]),
);
