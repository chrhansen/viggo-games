import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { gamesById } from "@/data/games";

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? gamesById[gameId] : null;

  if (!game) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex flex-col bg-background p-4 md:p-8"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              to="/"
              className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
          <h2 className="text-xl font-bold font-display text-foreground">{game.title}</h2>
        </div>

        <a
          href={game.url}
          className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground border border-foreground/10 hover:border-primary hover:text-primary transition-colors"
        >
          Open Standalone
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="flex-1 rounded-[20px] overflow-hidden border border-foreground/10 bg-card">
        <iframe
          src={game.url}
          title={game.title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; pointer-lock; accelerometer; gyroscope"
        />
      </div>
    </motion.div>
  );
};

export default GamePage;
