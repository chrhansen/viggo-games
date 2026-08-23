import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import GameLanding from "@/components/GameLanding";
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
import NotFound from "@/pages/NotFound";

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? gamesById[gameId] : null;
  const [playingGameId, setPlayingGameId] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  usePageSeo(game ? gameSeo(game) : notFoundSeo());

  if (!game) {
    return <NotFound />;
  }

  if (playingGameId !== game.id) {
    return (
      <GameLanding
        game={game}
        onPlay={() => {
          trackGameStart(game);
          setPlayingGameId(game.id);
        }}
      />
    );
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
          aria-label={`Exit ${game.title}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 bg-card text-muted-foreground transition-colors hover:text-foreground backdrop-blur"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </motion.div>

      <iframe
        src={game.url}
        title={game.title}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; accelerometer; gyroscope"
      />

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you want to exit {game.title}?</AlertDialogTitle>
            <AlertDialogDescription>You will return to the {game.title} mission page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                trackGameExit(game);
                setPlayingGameId(null);
                setShowExitDialog(false);
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
