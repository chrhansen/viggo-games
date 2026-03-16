import { motion } from "framer-motion";
import { ArrowLeft, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import viggoImg from "@/assets/viggo.png";
import { Button } from "@/components/ui/button";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh flex flex-col justify-center p-6 md:p-8">
      <motion.div
        className="max-w-2xl mx-auto w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>

        <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tighter text-primary mb-6">
          About
        </h1>

        <div className="space-y-6 text-foreground/80 font-mono text-sm leading-relaxed">
          <img
            src={viggoImg}
            alt="Viggo, the creator of viggo.games"
            className="w-32 h-32 rounded-xl object-cover border-2 border-border shadow-md"
          />

          <p>
            <span className="text-primary font-bold">VIGGO.GAMES</span> is a collection of browser games
            made by Viggo, built for fun, learning, and a bit of arcade nostalgia.
          </p>

          <p>
            All games on this site are designed and developed by Viggo with a little help from his dad
            and codex.
          </p>

          <p>
            The site itself is open source. Check out the code, suggest improvements, or just poke
            around:
          </p>

          <a
            href="https://github.com/chrhansen/viggo-games"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>github.com/chrhansen/viggo-games</span>
          </a>
        </div>

        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-16">
          Made with heart and pixels
        </p>
      </motion.div>
    </div>
  );
};

export default About;
