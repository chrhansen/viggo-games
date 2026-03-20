import type { Game } from "@/data/games";

type AnalyticsProps = Record<string, string | number | boolean>;

const trackEvent = (eventName: string, props?: AnalyticsProps) => {
  if (typeof window === "undefined") {
    return;
  }

  window.umami?.track(eventName, props);
};

export const trackPageview = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.umami?.track();
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
