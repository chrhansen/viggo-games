import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArcadeCard from "@/components/ArcadeCard";
import chickenHopImg from "@/assets/chicken-hop.png";
import hunterGuyImg from "@/assets/hunter-guy.png";

interface Game {
  id: string;
  title: string;
  image: string;
  color: string;
  level: string;
  url: string;
}

const games: Game[] = [
  {
    id: "chicken-hop",
    title: "Chicken Hop",
    image: chickenHopImg,
    color: "#FF4B4B",
    level: "Level 01",
    url: "", // Add the game URL here
  },
  {
    id: "hunter-guy",
    title: "Hunter Guy",
    image: hunterGuyImg,
    color: "#22C55E",
    level: "Level 02",
    url: "", // Add the game URL here
  },
];

const Index = () => {
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  return (
    <div className="min-h-svh flex flex-col justify-center p-6 md:p-8">
      <AnimatePresence>
        {activeGame && (
          <GameView
            title={activeGame.title}
            gameUrl={activeGame.url}
            onClose={() => setActiveGame(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={activeGame ? { scale: 0.9, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-6xl mx-auto w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-5xl md:text-6xl font-extrabold font-display tracking-tighter text-primary"
          >
            VIGGO.GAMES
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-3"
          >
            Select Your Mission
          </motion.p>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {games.map((game, i) => (
            <ArcadeCard
              key={game.id}
              title={game.title}
              image={game.image}
              color={game.color}
              level={game.level}
              index={i}
              onClick={() => setActiveGame(game)}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-12"
        >
          Insert Coin · High Score: 0000
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Index;
