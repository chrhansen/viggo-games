export const SITE_URL = "https://viggo.games";
export const SITE_NAME = "viggo.games";
export const DEFAULT_SOCIAL_IMAGE = "/seo/viggo-games-social.jpg";

const DEFAULT_SOCIAL_IMAGE_ALT =
  "viggo.games arcade collage featuring Chicken Hop, Hunter Guy, Burb, Gunny, and Torpedo";

export const absoluteUrl = (path) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const createHomeSeo = (games) => ({
  title: "viggo.games – Free Browser Arcade Games by Viggo",
  description:
    "Play five free browser games made by Viggo: Chicken Hop, Hunter Guy, Burb, Gunny, and Torpedo. No download—just choose a mission and play.",
  path: "/",
  image: DEFAULT_SOCIAL_IMAGE,
  imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
  imageWidth: 1200,
  imageHeight: 630,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "Viggo Games",
      url: absoluteUrl("/"),
      inLanguage: "en",
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

export const createAboutSeo = () => ({
  title: "About viggo.games – Browser Games by Viggo",
  description:
    "Meet the young creator behind viggo.games, an open-source collection of free browser games made for fun, learning, and arcade nostalgia.",
  path: "/about/",
  image: DEFAULT_SOCIAL_IMAGE,
  imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
  imageWidth: 1200,
  imageHeight: 630,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About viggo.games",
      url: absoluteUrl("/about/"),
      inLanguage: "en",
      description:
        "viggo.games is a collection of browser games made by Viggo for fun, learning, and arcade nostalgia.",
      isPartOf: websiteJsonLd(),
    },
  ],
});

export const createGameSeo = (game) => ({
  title: game.seoTitle,
  description: game.metaDescription,
  path: game.routePath,
  image: `/seo/${game.imageFile}`,
  imageAlt: game.imageAlt,
  imageWidth: game.imageWidth,
  imageHeight: game.imageHeight,
  jsonLd: [
    gameJsonLd(game),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: absoluteUrl("/"),
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

export const createNotFoundSeo = () => ({
  title: "Page Not Found | viggo.games",
  description: "The requested viggo.games page could not be found.",
  path: "/404.html",
  image: DEFAULT_SOCIAL_IMAGE,
  imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
  imageWidth: 1200,
  imageHeight: 630,
  robots: "noindex, follow",
});

export const gameJsonLd = (game) => ({
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: game.title,
  url: absoluteUrl(game.routePath),
  mainEntityOfPage: absoluteUrl(game.routePath),
  image: absoluteUrl(`/seo/${game.imageFile}`),
  description: game.description,
  inLanguage: "en",
  isAccessibleForFree: true,
  applicationCategory: "GameApplication",
  applicationSubCategory: game.genre,
  operatingSystem: "Any modern web browser",
  gamePlatform: "Web browser",
  playMode: "SinglePlayer",
  genre: game.genre,
  keywords: game.keywords.join(", "),
  creator: {
    "@type": "Person",
    name: "Viggo",
  },
  publisher: organizationJsonLd(),
  isPartOf: websiteJsonLd(),
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(game.routePath),
  },
  potentialAction: {
    "@type": "PlayAction",
    target: absoluteUrl(game.urlPath),
  },
});

export const organizationJsonLd = () => ({
  "@type": "Organization",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  sameAs: ["https://github.com/chrhansen/viggo-games"],
});

const websiteJsonLd = () => ({
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
});
