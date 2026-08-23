import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { games, type Game } from "@/data/games";

interface GameLandingProps {
  game: Game;
  onPlay: () => void;
}

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.65, ease: [0.23, 1, 0.32, 1] },
  }),
};

const GameLanding = ({ game, onPlay }: GameLandingProps) => {
  const currentIndex = games.findIndex((candidate) => candidate.id === game.id);
  const relatedGames = [games[(currentIndex + 1) % games.length], games[(currentIndex + 2) % games.length]];
  const accentStyle = { "--game-accent": game.color } as CSSProperties;
  const imageSrcSet = `${game.thumbnail} 768w, ${game.image} ${game.imageWidth}w`;

  return (
    <main className="game-landing min-h-svh overflow-hidden px-5 pb-16 pt-6 md:px-8 md:pb-24" style={accentStyle}>
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All missions
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">
          Free · No download
        </span>
      </header>

      <article className="relative z-10 mx-auto mt-12 w-full max-w-7xl md:mt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <motion.p
              custom={0}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="game-accent-text font-mono text-xs font-bold uppercase tracking-[0.24em]"
            >
              {game.level} / {game.genre}
            </motion.p>
            <motion.h1
              custom={0.08}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mt-4 font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl"
            >
              {game.title}
            </motion.h1>
            <motion.p
              custom={0.16}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="game-accent-text mt-5 max-w-xl font-display text-xl font-bold leading-snug md:text-2xl"
            >
              {game.tagline}
            </motion.p>
            <motion.p
              custom={0.24}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mt-5 max-w-xl text-base leading-7 text-foreground/72"
            >
              {game.description}
            </motion.p>

            <motion.div custom={0.32} initial="hidden" animate="visible" variants={reveal} className="mt-8">
              <button
                type="button"
                onClick={onPlay}
                className="game-play-button inline-flex min-h-14 items-center gap-3 rounded-full px-7 font-mono text-sm font-bold uppercase tracking-[0.12em] text-background transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                aria-label={`Play ${game.title}`}
              >
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                Play now
              </button>
            </motion.div>

            <motion.dl
              custom={0.4}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55"
            >
              <div>
                <dt className="sr-only">Price</dt>
                <dd>Free to play</dd>
              </div>
              <div>
                <dt className="sr-only">Installation</dt>
                <dd>No installation</dd>
              </div>
              <div>
                <dt className="sr-only">Play mode</dt>
                <dd>Single player</dd>
              </div>
            </motion.dl>
          </div>

          <motion.figure
            custom={0.12}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="game-hero-frame relative overflow-hidden rounded-[24px] border border-white/15 bg-card p-2 md:rounded-[36px] md:p-3"
          >
            <img
              src={game.image}
              srcSet={imageSrcSet}
              sizes="(min-width: 1024px) 55vw, calc(100vw - 40px)"
              alt={game.imageAlt}
              width={game.imageWidth}
              height={game.imageHeight}
              decoding="async"
              className="aspect-video h-auto w-full rounded-[18px] object-cover md:rounded-[27px]"
            />
            <figcaption className="sr-only">Promotional artwork for {game.title}</figcaption>
          </motion.figure>
        </div>

        <section className="mt-20 grid gap-12 border-t border-white/10 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 md:mt-28 md:pt-16">
          <div>
            <p className="game-accent-text font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
              Mission briefing
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              How to play {game.title}
            </h2>
            <ol className="mt-8 space-y-7">
              {game.howToPlay.map((step, index) => (
                <li key={step} className="grid grid-cols-[40px_1fr] gap-4 text-base leading-7 text-foreground/75">
                  <span className="game-step-number font-mono text-sm font-bold" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="game-notes rounded-[24px] border border-white/10 p-6 md:rounded-[30px] md:p-8">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Mission notes</h2>
            <ul className="mt-5 space-y-4 text-base leading-7 text-foreground/68">
              {game.tips.map((tip) => (
                <li key={tip} className="flex gap-3">
                  <span className="game-accent-text mt-0.5 font-mono" aria-hidden="true">
                    +
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">Controls</h3>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${game.title} controls`}>
                {game.controls.map((control) => (
                  <li
                    key={control}
                    className="rounded-full border border-white/12 bg-black/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/75"
                  >
                    {control}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <nav className="mt-20 border-t border-white/10 pt-12 md:mt-28 md:pt-16" aria-labelledby="next-missions">
          <p className="game-accent-text font-mono text-[10px] font-bold uppercase tracking-[0.22em]">
            Continue playing
          </p>
          <h2 id="next-missions" className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Pick another mission
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {relatedGames.map((related) => (
              <Link
                key={related.id}
                to={related.routePath}
                className="group flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.035] p-3 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
              >
                <img
                  src={related.thumbnail}
                  alt=""
                  width="768"
                  height={Math.round((768 * related.imageHeight) / related.imageWidth)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-32 rounded-xl object-cover sm:w-40"
                />
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/60">
                    {related.genre}
                  </span>
                  <span className="mt-1 block truncate font-display text-xl font-bold">{related.title}</span>
                </span>
                <ArrowRight className="mr-2 h-5 w-5 text-foreground/35 transition-transform group-hover:translate-x-1 group-hover:text-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </nav>
      </article>
    </main>
  );
};

export default GameLanding;
