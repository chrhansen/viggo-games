import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { gamesById } from "@/data/games";
import { trackGameExit, trackGameStart } from "@/lib/analytics";
import { gameSeo, notFoundSeo, usePageSeo } from "@/lib/seo";

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const game = gameId ? gamesById[gameId] : null;
  const [showExitDialog, setShowExitDialog] = useState(false);
  usePageSeo(game ? gameSeo(game) : notFoundSeo());

  useEffect(() => {
    if (!game) {
      return;
    }

    trackGameStart(game);
  }, [game]);

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
        <button
          type="button"
          onClick={() => setShowExitDialog(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-card text-muted-foreground transition-colors hover:text-foreground backdrop-blur"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </motion.div>

      <iframe
        src={game.url}
        title={game.title}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; pointer-lock; accelerometer; gyroscope"
      />

      <main className="sr-only" aria-labelledby="game-title">
        <h1 id="game-title">{game.title}</h1>
        <p>{game.description}</p>
        <p>{game.metaDescription}</p>
        <a href={game.url}>Play {game.title} directly</a>
        <a href="/">Browse all viggo.games browser games</a>
      </main>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you want to exit {game.title}?</AlertDialogTitle>
            <AlertDialogDescription>You will return to the main page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                trackGameExit(game);
                navigate("/");
              }}
            >
              Exit Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GamePage;
