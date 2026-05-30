import { useEffect } from "react";
import type { Game } from "@/data/games";

export const SITE_URL = "https://viggo.games";
export const SITE_NAME = "viggo.games";
export const DEFAULT_SOCIAL_IMAGE = "/seo/viggo.png";

type JsonLd = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
  jsonLd?: JsonLd[];
}

export const absoluteUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const homeSeo = (games: Game[]): SeoConfig => ({
  title: "viggo.games - Free Browser Arcade Games by Viggo",
  description:
    "Play free browser games made by Viggo, including Chicken Hop, Hunter Guy, Burb, Gunny, and Torpedo. Small arcade games for keyboard, mouse, and touch.",
  path: "/",
  image: DEFAULT_SOCIAL_IMAGE,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "A collection of free browser games made by Viggo, built for fun, learning, and arcade nostalgia.",
      publisher: organizationJsonLd(),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "viggo.games browser games",
      itemListElement: games.map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: game.title,
        url: absoluteUrl(game.routePath),
      })),
    },
  ],
});

export const aboutSeo = (): SeoConfig => ({
  title: "About viggo.games - Browser Games by Viggo",
  description:
    "Learn about viggo.games, an open source collection of browser games designed and developed by Viggo with help from his dad and Codex.",
  path: "/about",
  image: DEFAULT_SOCIAL_IMAGE,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About viggo.games",
      url: absoluteUrl("/about"),
      description:
        "viggo.games is a collection of browser games made by Viggo for fun, learning, and arcade nostalgia.",
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  ],
});

export const gameSeo = (game: Game): SeoConfig => ({
  title: `${game.title} - Free Browser Game | viggo.games`,
  description: game.metaDescription,
  path: game.routePath,
  image: `/seo/${game.imageFile}`,
  jsonLd: [
    gameSoftwareJsonLd(game),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: game.title,
          item: absoluteUrl(game.routePath),
        },
      ],
    },
  ],
});

export const notFoundSeo = (): SeoConfig => ({
  title: "Page Not Found | viggo.games",
  description: "The requested viggo.games page could not be found.",
  path: "/404.html",
  robots: "noindex, follow",
});

export const gameSoftwareJsonLd = (game: Game): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: game.title,
  url: absoluteUrl(game.routePath),
  sameAs: absoluteUrl(game.urlPath),
  image: absoluteUrl(`/seo/${game.imageFile}`),
  description: game.description,
  applicationCategory: "GameApplication",
  applicationSubCategory: game.genre,
  operatingSystem: "Any modern web browser",
  gamePlatform: "Web browser",
  genre: game.genre,
  keywords: game.keywords.join(", "),
  creator: organizationJsonLd(),
  publisher: organizationJsonLd(),
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(game.routePath),
  },
});

const organizationJsonLd = (): JsonLd => ({
  "@type": "Organization",
  name: "viggo.games",
  url: SITE_URL,
  sameAs: ["https://github.com/chrhansen/viggo-games"],
});

export const usePageSeo = (config: SeoConfig) => {
  useEffect(() => {
    applySeo(config);
  }, [config]);
};

const applySeo = (config: SeoConfig) => {
  document.title = config.title;

  setMeta("name", "description", config.description);
  setMeta("name", "robots", config.robots ?? "index, follow, max-image-preview:large");
  setLink("canonical", absoluteUrl(config.path));

  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:type", config.type ?? "website");
  setMeta("property", "og:title", config.title);
  setMeta("property", "og:description", config.description);
  setMeta("property", "og:url", absoluteUrl(config.path));
  setMeta("property", "og:image", absoluteUrl(config.image ?? DEFAULT_SOCIAL_IMAGE));
  setMeta("property", "og:image:alt", `${config.title} preview image`);

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", config.title);
  setMeta("name", "twitter:description", config.description);
  setMeta("name", "twitter:image", absoluteUrl(config.image ?? DEFAULT_SOCIAL_IMAGE));

  document.querySelectorAll("script[data-seo-jsonld]").forEach((element) => element.remove());

  config.jsonLd?.forEach((jsonLd) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoJsonld = "true";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  });
};

const setMeta = (attribute: "name" | "property", key: string, content: string) => {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
};

const setLink = (rel: string, href: string) => {
  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
};
