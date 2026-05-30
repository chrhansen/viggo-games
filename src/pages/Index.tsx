import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArcadeCard from "@/components/ArcadeCard";
import { games } from "@/data/games";
import { withBasePath } from "@/lib/app-base";
import { homeSeo, usePageSeo } from "@/lib/seo";

const Index = () => {
  const navigate = useNavigate();
  usePageSeo(homeSeo(games));

  return (
    <main className="min-h-svh flex flex-col justify-center p-6 md:p-8">
      <motion.div
        className="max-w-6xl mx-auto w-full"
      >
        {/* Header */}
        <header className="text-center mb-12">
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
          <motion.p
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-5 max-w-2xl text-sm md:text-base font-mono leading-relaxed text-foreground/75"
          >
            Free browser arcade games made by Viggo. Play Chicken Hop, Hunter Guy, Burb, Gunny,
            and Torpedo with keyboard, mouse, touch, or tilt controls.
          </motion.p>
        </header>

        {/* Game Grid */}
        <nav
          aria-label="Browser games"
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 justify-items-center"
        >
          {games.map((game, i) => (
            <ArcadeCard
              key={game.id}
              title={game.title}
              image={game.image}
              color={game.color}
              level={game.level}
              tagline={game.tagline}
              index={i}
              href={withBasePath(game.routePath)}
              onClick={(event) => {
                event.preventDefault();
                navigate(game.routePath);
              }}
            />
          ))}
        </nav>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-12"
        >
          Insert Coin · High Score: 0000
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.68 }}
          className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-2"
        >
          <a
            href={withBasePath("/about")}
            onClick={(event) => {
              event.preventDefault();
              navigate("/about");
            }}
            className="inline-block mt-2 px-6 py-2.5 text-xs font-mono uppercase tracking-widest border-2 border-primary text-primary rounded-md bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          >
            About
          </a>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default Index;
