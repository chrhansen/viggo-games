import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import chickenHopImg from "@/assets/chicken-hop.png";
import hunterGuyImg from "@/assets/hunter-guy.png";

const games: Record<string, { title: string; image: string; color: string; url: string }> = {
  "chicken-hop": {
    title: "Chicken Hop",
    image: chickenHopImg,
    color: "#FF4B4B",
    url: "",
  },
  "hunter-guy": {
    title: "Hunter Guy",
    image: hunterGuyImg,
    color: "#22C55E",
    url: "",
  },
};

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const game = gameId ? games[gameId] : null;

  if (!game) {
    navigate("/");
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex flex-col bg-background p-4 md:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h2 className="text-xl font-bold font-display text-foreground">{game.title}</h2>
        </div>
      </div>

      <div className="flex-1 rounded-[20px] overflow-hidden border border-foreground/10 bg-card">
        <iframe
          src={game.url}
          title={game.title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
        />
      </div>
    </motion.div>
  );
};

export default GamePage;
