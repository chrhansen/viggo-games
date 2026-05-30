import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const SITE_URL = "https://viggo.games";
const SITE_NAME = "viggo.games";

const distDir = resolve("dist");
const indexPath = resolve(distDir, "index.html");
const notFoundPath = resolve(distDir, "404.html");
const gameRecordsPath = resolve("src/data/games.json");

if (!existsSync(indexPath)) {
  throw new Error(`Missing build output: ${indexPath}`);
}

const baseHtml = readFileSync(indexPath, "utf8");
const games = JSON.parse(readFileSync(gameRecordsPath, "utf8"));

copySeoImages();

const routePages = [
  homePage(),
  aboutPage(),
  ...games.map((game) => gamePage(game)),
];

routePages.forEach(writeRoutePage);
writeNotFoundPage();
writeSitemap(routePages);
writeLlmsFiles();
injectDirectGameMetadata();

console.log(`Prepared ${routePages.length} crawlable route pages, sitemap.xml, llms.txt, and 404.html`);

function homePage() {
  return {
    path: "/",
    outputPath: indexPath,
    depth: 0,
    title: "viggo.games - Free Browser Arcade Games by Viggo",
    description:
      "Play free browser games made by Viggo, including Chicken Hop, Hunter Guy, Burb, Gunny, and Torpedo. Small arcade games for keyboard, mouse, and touch.",
    image: "/seo/viggo.png",
    body: renderHomeBody(),
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
  };
}

function aboutPage() {
  return {
    path: "/about",
    outputPath: resolve(distDir, "about/index.html"),
    depth: 1,
    title: "About viggo.games - Browser Games by Viggo",
    description:
      "Learn about viggo.games, an open source collection of browser games designed and developed by Viggo with help from his dad and Codex.",
    image: "/seo/viggo.png",
    body: renderAboutBody(),
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
  };
}

function gamePage(game) {
  return {
    path: game.routePath,
    outputPath: resolve(distDir, `${game.id}/index.html`),
    depth: 1,
    title: `${game.title} - Free Browser Game | viggo.games`,
    description: game.metaDescription,
    image: `/seo/${game.imageFile}`,
    body: renderGameBody(game),
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
  };
}

function writeRoutePage(page) {
  mkdirSync(dirname(page.outputPath), { recursive: true });

  const html = withRelativeAssets(
    injectPage(baseHtml, {
      ...page,
      robots: "index, follow, max-image-preview:large",
    }),
    page.depth,
  );

  writeFileSync(page.outputPath, html);
}

function writeNotFoundPage() {
  const html = injectPage(baseHtml, {
    path: "/404.html",
    title: "Page Not Found | viggo.games",
    description: "The requested viggo.games page could not be found.",
    image: "/seo/viggo.png",
    robots: "noindex, follow",
    body: `
      <main data-seo-fallback>
        <h1>Page not found</h1>
        <p>The requested viggo.games page could not be found.</p>
        <p><a href="/">Return to all browser games</a></p>
      </main>
    `,
    jsonLd: [],
  });

  writeFileSync(notFoundPath, html);
}

function injectPage(html, page) {
  const cleaned = stripManagedHead(html);
  return cleaned
    .replace("</head>", `${renderHead(page)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">\n${page.body.trim()}\n    </div>`);
}

function stripManagedHead(html) {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name="description"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+name="robots"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+property="og:[^"]+"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]+"[\s\S]*?>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[\s\S]*?>/gi, "")
    .replace(/\s*<script\s+type="application\/ld\+json"\s+data-seo-jsonld[\s\S]*?<\/script>/gi, "");
}

function renderHead(page) {
  const imageUrl = absoluteUrl(page.image ?? "/seo/viggo.png");
  const pageUrl = absoluteUrl(page.path);
  const jsonLdTags = page.jsonLd
    .map(
      (data) =>
        `<script type="application/ld+json" data-seo-jsonld>${safeJson(data)}</script>`,
    )
    .join("\n    ");

  return `
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeAttribute(page.description)}" />
    <meta name="robots" content="${escapeAttribute(page.robots)}" />
    <link rel="canonical" href="${pageUrl}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${escapeAttribute(page.description)}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="${escapeAttribute(`${page.title} preview image`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(page.description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    ${jsonLdTags}`;
}

function withRelativeAssets(html, depth) {
  if (depth === 0) {
    return html;
  }

  const prefix = "../".repeat(depth);
  return html
    .replaceAll('src="./assets/', `src="${prefix}assets/`)
    .replaceAll('href="./assets/', `href="${prefix}assets/`);
}

function writeSitemap(pages) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${absoluteUrl(page.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.path === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${page.path === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("");

  writeFileSync(
    resolve(distDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`,
  );
}

function writeLlmsFiles() {
  writeFileSync(resolve(distDir, "llms.txt"), renderLlmsIndex());
  writeFileSync(resolve(distDir, "llms-full.txt"), renderLlmsFull());
}

function renderLlmsIndex() {
  const gameLinks = games
    .map(
      (game) =>
        `- [${game.title}](${absoluteUrl(game.routePath)}): ${game.description} Direct playable file: ${absoluteUrl(game.urlPath)}`,
    )
    .join("\n");

  return `# viggo.games

> Free browser games made by Viggo, built for fun, learning, and arcade nostalgia.

## Main Pages

- [Home](${absoluteUrl("/")}): Browse every current viggo.games browser game.
- [About](${absoluteUrl("/about")}): Learn who made viggo.games and find the open source repository.
- [Full LLM context](${absoluteUrl("/llms-full.txt")}): Plain text summary of all current games.

## Games

${gameLinks}

## Facts

- Site name: viggo.games
- Canonical URL: ${SITE_URL}
- Repository: https://github.com/chrhansen/viggo-games
- Current games: ${games.map((game) => game.title).join(", ")}
`;
}

function renderLlmsFull() {
  const gameSections = games
    .map(
      (game) => `## ${game.title}

- Canonical page: ${absoluteUrl(game.routePath)}
- Direct playable file: ${absoluteUrl(game.urlPath)}
- Genre: ${game.genre}
- Controls: ${game.controls.join(", ")}
- Summary: ${game.description}
- Search keywords: ${game.keywords.join(", ")}
`,
    )
    .join("\n");

  return `# viggo.games LLM Context

viggo.games is a free browser-game collection made by Viggo. The site is open source and hosted from the chrhansen/viggo-games repository on GitHub Pages.

${gameSections}
`;
}

function injectDirectGameMetadata() {
  games.forEach((game) => {
    const gameIndexPath = resolve(distDir, `games/${game.id}/index.html`);

    if (!existsSync(gameIndexPath)) {
      return;
    }

    const directHtml = readFileSync(gameIndexPath, "utf8");
    const page = {
      path: game.routePath,
      title: `${game.title} - Play Free on viggo.games`,
      description: game.metaDescription,
      image: `/seo/${game.imageFile}`,
      robots: "index, follow, max-image-preview:large",
      jsonLd: [gameJsonLd(game)],
    };

    const updatedHtml = stripManagedHead(directHtml).replace(
      "</head>",
      `${renderHead(page)}\n  </head>`,
    );

    writeFileSync(gameIndexPath, updatedHtml);
  });
}

function copySeoImages() {
  const imageDir = resolve(distDir, "seo");
  mkdirSync(imageDir, { recursive: true });

  const images = new Set(["viggo.png", ...games.map((game) => game.imageFile)]);

  images.forEach((imageFile) => {
    const sourcePath = resolve("src/assets", imageFile);
    const targetPath = resolve(imageDir, imageFile);

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing SEO image source: ${sourcePath}`);
    }

    copyFileSync(sourcePath, targetPath);
  });
}

function renderHomeBody() {
  const gameItems = games
    .map(
      (game) => `
        <li>
          <a href="${game.routePath}">${escapeHtml(game.title)}</a>
          <p>${escapeHtml(game.description)}</p>
        </li>`,
    )
    .join("");

  return `
    <main data-seo-fallback>
      <h1>viggo.games</h1>
      <p>Free browser arcade games made by Viggo. Play Chicken Hop, Hunter Guy, Burb, Gunny, and Torpedo with keyboard, mouse, touch, or tilt controls.</p>
      <nav aria-label="Browser games">
        <ul>${gameItems}
        </ul>
      </nav>
      <p><a href="/about">About viggo.games</a></p>
    </main>
  `;
}

function renderAboutBody() {
  return `
    <main data-seo-fallback>
      <h1>About viggo.games</h1>
      <p>viggo.games is a collection of browser games made by Viggo, built for fun, learning, and arcade nostalgia.</p>
      <p>The site is open source at <a href="https://github.com/chrhansen/viggo-games">github.com/chrhansen/viggo-games</a>.</p>
      <p><a href="/">Browse all games</a></p>
    </main>
  `;
}

function renderGameBody(game) {
  return `
    <main data-seo-fallback>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml(game.description)}</p>
      <p>${escapeHtml(game.metaDescription)}</p>
      <ul>
        <li>Genre: ${escapeHtml(game.genre)}</li>
        <li>Controls: ${escapeHtml(game.controls.join(", "))}</li>
      </ul>
      <p><a href="${game.urlPath}">Play ${escapeHtml(game.title)} directly</a></p>
      <p><a href="/">Browse all viggo.games browser games</a></p>
    </main>
  `;
}

function gameJsonLd(game) {
  return {
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
  };
}

function organizationJsonLd() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    sameAs: ["https://github.com/chrhansen/viggo-games"],
  };
}

function absoluteUrl(path) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function safeJson(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
