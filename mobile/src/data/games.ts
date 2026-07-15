import burbImage from "../../assets/games/burb.webp";
import chickenHopImage from "../../assets/games/chicken-hop.webp";
import gunnyImage from "../../assets/games/gunny.webp";
import hunterGuyImage from "../../assets/games/hunter-guy.webp";
import torpedoImage from "../../assets/games/torpedo.webp";

export interface GamePreview {
  id: string;
  level: string;
  title: string;
  tagline: string;
  genre: string;
  color: string;
  image: number;
  status: "next" | "locked";
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
    status: "next",
  },
  {
    id: "hunter-guy",
    level: "02",
    title: "Hunter Guy",
    tagline: "Explore the forest and tag the wildlife.",
    genre: "Forest adventure",
    color: "#22C55E",
    image: hunterGuyImage,
    status: "locked",
  },
  {
    id: "burb",
    level: "03",
    title: "Burb",
    tagline: "Tiny bird. Winding road. Serious steering.",
    genre: "Cycling game",
    color: "#FF7A99",
    image: burbImage,
    status: "locked",
  },
  {
    id: "gunny",
    level: "04",
    title: "Gunny",
    tagline: "Space is loud. Your blaster is louder.",
    genre: "Space shooter",
    color: "#63F3FF",
    image: gunnyImage,
    status: "locked",
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
