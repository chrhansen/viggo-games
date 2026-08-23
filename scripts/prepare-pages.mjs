import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  absoluteUrl,
  createAboutSeo,
  createGameSeo,
  createHomeSeo,
  createNotFoundSeo,
  DEFAULT_SOCIAL_IMAGE,
  gameJsonLd,
  SITE_NAME,
  SITE_URL,
} from "../src/lib/seo-config.js";

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

const routePages = [homePage(), aboutPage(), ...games.map((game) => gamePage(game))];

routePages.forEach(writeRoutePage);
writeNotFoundPage();
writeSitemap(routePages);
writeLlmsFiles();
injectDirectGameMetadata();
validateBuild(routePages);

console.log(
  `Prepared and validated ${routePages.length} crawlable route pages, sitemap.xml, llms.txt, and 404.html`,
);

function homePage() {
  return {
    ...createHomeSeo(games),
    outputPath: indexPath,
    depth: 0,
    body: renderHomeBody(),
  };
}

function aboutPage() {
  return {
    ...createAboutSeo(),
    outputPath: resolve(distDir, "about/index.html"),
    depth: 1,
    body: renderAboutBody(),
  };
}

function gamePage(game) {
  return {
    ...createGameSeo(game),
    outputPath: resolve(distDir, `${game.id}/index.html`),
    depth: 1,
    body: renderGameBody(game),
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
  const html = withRootAssets(
    injectPage(baseHtml, {
      ...createNotFoundSeo(),
      body: `
        <main data-seo-fallback>
          <h1>Page not found</h1>
          <p>The requested viggo.games page could not be found.</p>
          <p><a href="/">Return to all browser games</a></p>
        </main>
      `,
      jsonLd: [],
    }),
  );

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
    .replace(
      /\s*<script\s+type="application\/ld\+json"\s+data-seo-jsonld[\s\S]*?<\/script>/gi,
      "",
    );
}

function renderHead(page) {
  const imageUrl = absoluteUrl(page.image ?? DEFAULT_SOCIAL_IMAGE);
  const imageAlt = page.imageAlt ?? `${page.title} preview image`;
  const pageUrl = absoluteUrl(page.path);
  const dimensions = [
    page.imageWidth
      ? `<meta property="og:image:width" content="${page.imageWidth}" />`
      : "",
    page.imageHeight
      ? `<meta property="og:image:height" content="${page.imageHeight}" />`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  const jsonLdTags = (page.jsonLd ?? [])
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
    <meta property="og:type" content="${page.type ?? "website"}" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${escapeAttribute(page.description)}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="${escapeAttribute(imageAlt)}" />
    ${dimensions}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(page.description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}" />
    ${jsonLdTags}`;
}

function withRelativeAssets(html, depth) {
  if (depth === 0) {
    return html;
  }

  const prefix = "../".repeat(depth);
  return html
    .replaceAll('src="./assets/', `src="${prefix}assets/`)
    .replaceAll('href="./assets/', `href="${prefix}assets/`)
    .replaceAll('href="./favicon.ico"', `href="${prefix}favicon.ico"`);
}

function withRootAssets(html) {
  return html
    .replaceAll('src="./assets/', 'src="/assets/')
    .replaceAll('href="./assets/', 'href="/assets/')
    .replaceAll('href="./favicon.ico"', 'href="/favicon.ico"');
}

function writeSitemap(pages) {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${escapeHtml(absoluteUrl(page.path))}</loc>
  </url>`,
    )
    .join("\n");

  writeFileSync(
    resolve(distDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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
- [About](${absoluteUrl("/about/")}): Learn who made viggo.games and find the open-source repository.
- [Full LLM context](${absoluteUrl("/llms-full.txt")}): Plain-text summary of all current games.

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
- How to play: ${game.howToPlay.join(" ")}
- Tips: ${game.tips.join(" ")}
`,
    )
    .join("\n");

  return `# viggo.games LLM Context

viggo.games is a free browser-game collection made by Viggo. The site is open source and hosted from the chrhansen/viggo-games repository on GitHub Pages.

${gameSections}`;
}

function injectDirectGameMetadata() {
  games.forEach((game) => {
    const gameIndexPath = resolve(distDir, `games/${game.id}/index.html`);

    if (!existsSync(gameIndexPath)) {
      return;
    }

    const directHtml = readFileSync(gameIndexPath, "utf8");
    const metadata = createGameSeo(game);
    const updatedHtml = stripManagedHead(directHtml).replace(
      "</head>",
      `${renderHead({
        ...metadata,
        robots: "index, follow, max-image-preview:large",
        jsonLd: [gameJsonLd(game)],
      })}\n  </head>`,
    );

    writeFileSync(gameIndexPath, updatedHtml);
  });
}

function copySeoImages() {
  const imageDir = resolve(distDir, "seo");
  mkdirSync(imageDir, { recursive: true });

  const socialImage = DEFAULT_SOCIAL_IMAGE.split("/").pop();
  const images = new Set([socialImage, ...games.map((game) => game.imageFile)]);

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
          <article>
            <h2><a href="${game.routePath}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml(game.description)}</p>
          </article>
        </li>`,
    )
    .join("");

  return `
    <main data-seo-fallback>
      <h1>Free browser arcade games by Viggo</h1>
      <p>Choose from five original browser games. Every mission is free, playable without a download, and built for keyboard, mouse, touch, or tilt controls.</p>
      <nav aria-label="Browser games">
        <ul>${gameItems}
        </ul>
      </nav>
      <p><a href="/about/">About viggo.games</a></p>
    </main>
  `;
}

function renderAboutBody() {
  return `
    <main data-seo-fallback>
      <h1>About viggo.games</h1>
      <p>viggo.games is a collection of browser games made by Viggo, built for fun, learning, and arcade nostalgia.</p>
      <p>Every current game is free to play in a modern browser, with no download required.</p>
      <p>The site is open source at <a href="https://github.com/chrhansen/viggo-games">github.com/chrhansen/viggo-games</a>.</p>
      <p><a href="/">Browse all games</a></p>
    </main>
  `;
}

function renderGameBody(game) {
  const relatedLinks = relatedGames(game)
    .map(
      (related) =>
        `<li><a href="${related.routePath}">${escapeHtml(related.title)} – ${escapeHtml(related.genre)}</a></li>`,
    )
    .join("");
  const steps = game.howToPlay
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");
  const tips = game.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("");

  return `
    <main data-seo-fallback>
      <p><a href="/">All browser games</a></p>
      <article>
        <p>${escapeHtml(game.level)} · ${escapeHtml(game.genre)} · Free to play</p>
        <h1>${escapeHtml(game.title)}</h1>
        <p>${escapeHtml(game.tagline)}</p>
        <p>${escapeHtml(game.description)}</p>
        <p><a href="${game.urlPath}">Play ${escapeHtml(game.title)}</a></p>
        <h2>How to play ${escapeHtml(game.title)}</h2>
        <ol>${steps}</ol>
        <h2>Controls</h2>
        <p>${escapeHtml(game.controls.join(", "))}</p>
        <h2>Mission tips</h2>
        <ul>${tips}</ul>
      </article>
      <nav aria-label="More browser games">
        <h2>Play another mission</h2>
        <ul>${relatedLinks}</ul>
      </nav>
    </main>
  `;
}

function relatedGames(game) {
  const index = games.findIndex((candidate) => candidate.id === game.id);
  return [games[(index + 1) % games.length], games[(index + 2) % games.length]];
}

function validateBuild(pages) {
  const sitemap = readFileSync(resolve(distDir, "sitemap.xml"), "utf8");
  const notFoundHtml = readFileSync(notFoundPath, "utf8");
  const canonicalUrls = new Set();

  if (!notFoundHtml.includes('href="/favicon.ico"') || /(?:src|href)="\.\//.test(notFoundHtml)) {
    throw new Error("404 page assets must resolve from the site root");
  }

  pages.forEach((page) => {
    if (page.path !== "/" && !page.path.endsWith("/")) {
      throw new Error(`Non-root canonical path must end in a slash: ${page.path}`);
    }

    const canonicalUrl = absoluteUrl(page.path);
    const html = readFileSync(page.outputPath, "utf8");
    const canonicalTags = html.match(/<link rel="canonical"/g) ?? [];
    const expectedCanonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
    const fallback = html.match(/<main data-seo-fallback>[\s\S]*?<\/main>/)?.[0];

    if (canonicalTags.length !== 1 || !html.includes(expectedCanonicalTag)) {
      throw new Error(`Invalid canonical tag in ${page.outputPath}`);
    }

    if (!fallback) {
      throw new Error(`Missing static fallback content in ${page.outputPath}`);
    }

    if (fallback.includes("<img")) {
      throw new Error(`Static fallback must not duplicate React image downloads: ${page.outputPath}`);
    }

    if (page.depth > 0 && !html.includes(`href="${"../".repeat(page.depth)}favicon.ico"`)) {
      throw new Error(`Invalid favicon path in ${page.outputPath}`);
    }

    if (!sitemap.includes(`<loc>${canonicalUrl}</loc>`)) {
      throw new Error(`Sitemap is missing ${canonicalUrl}`);
    }

    if (canonicalUrls.has(canonicalUrl)) {
      throw new Error(`Duplicate canonical URL: ${canonicalUrl}`);
    }

    canonicalUrls.add(canonicalUrl);
  });

  if (/<(?:lastmod|changefreq|priority)>/.test(sitemap)) {
    throw new Error("Sitemap contains unsupported or synthetic metadata");
  }

  games.forEach((game) => {
    const directHtml = readFileSync(resolve(distDir, `games/${game.id}/index.html`), "utf8");
    const expectedCanonicalTag = `<link rel="canonical" href="${absoluteUrl(game.routePath)}" />`;
    if (!directHtml.includes(expectedCanonicalTag)) {
      throw new Error(`Direct game page does not canonicalize to ${game.routePath}`);
    }
  });
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
