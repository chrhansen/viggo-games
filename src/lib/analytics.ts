import type { Game } from "@/data/games";

const trackEvent = (eventName: string, props?: Record<string, string>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.plausible?.(eventName, props ? { props } : undefined);
};

const getGameProps = (game: Game) => ({
  gameId: game.id,
  gameTitle: game.title,
});

export const trackGameStart = (game: Game) => {
  trackEvent("Game Start", getGameProps(game));
};

export const trackGameExit = (game: Game) => {
  trackEvent("Game Exit", getGameProps(game));
};
