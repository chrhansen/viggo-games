import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { gamesById } from "@/data/games";

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? gamesById[gameId] : null;

  if (!game) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fixed inset-0 bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute left-4 top-4 z-10"
      >
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-card text-muted-foreground transition-colors hover:text-foreground backdrop-blur"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </motion.div>

      <iframe
        src={game.url}
        title={game.title}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; pointer-lock; accelerometer; gyroscope"
      />
    </div>
  );
};

export default GamePage;
