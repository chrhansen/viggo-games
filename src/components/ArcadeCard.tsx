import { motion } from "framer-motion";
import { Play } from "lucide-react";

interface ArcadeCardProps {
  title: string;
  image: string;
  color: string;
  level: string;
  index: number;
  onClick: () => void;
}

const ArcadeCard = ({ title, image, color, level, index, onClick }: ArcadeCardProps) => {
  return (
    <motion.button
      type="button"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group bg-card rounded-[32px] p-4 overflow-hidden border border-foreground/10 text-left"
      style={{ boxShadow: `0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)` }}
    >
      {/* Game Image */}
      <div className="aspect-video rounded-[20px] bg-secondary mb-4 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Title & Action */}
      <div className="flex justify-between items-center px-2 pb-2">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {level}
          </span>
          <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
        </div>
        <div className="h-12 w-12 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
          <Play className="w-5 h-5 text-foreground group-hover:text-primary-foreground transition-colors duration-300" />
        </div>
      </div>

      {/* Neon Underglow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-3xl -z-10"
        style={{ backgroundColor: color }}
      />
    </motion.button>
  );
};

export default ArcadeCard;
