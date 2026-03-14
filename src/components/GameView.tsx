import { motion } from "framer-motion";
import { X } from "lucide-react";

interface GameViewProps {
  title: string;
  gameUrl: string;
  onClose: () => void;
}

const GameView = ({ title, gameUrl, onClose }: GameViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-background p-4 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-display text-foreground">{title}</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Game iframe */}
      <div className="flex-1 rounded-[20px] overflow-hidden border border-foreground/10 bg-card">
        <iframe
          src={gameUrl}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
        />
      </div>
    </motion.div>
  );
};

export default GameView;
