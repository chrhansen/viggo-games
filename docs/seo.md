---
read_when:
  - Adding or renaming a public page or game
  - Changing titles, descriptions, artwork, routes, or structured data
  - Verifying search-engine indexing after a deploy
---

# Search visibility

viggo.games is a React app with crawlable HTML generated during `npm run build`. The build writes a static entrypoint for the homepage, About page, and every game landing page. React then replaces that fallback with the interactive UI in a browser.

## Source of truth

- `src/data/games.json`: game titles, canonical paths, descriptions, artwork metadata, controls, how-to steps, and tips
- `src/lib/seo-config.js`: shared page metadata and JSON-LD used by both React and the static-page builder
- `scripts/prepare-pages.mjs`: static HTML, sitemap, LLM context, direct-game canonicals, and build validation
- `src/assets/viggo-games-social.jpg`: default 1200×630 social-sharing card

Do not duplicate titles or structured data in a second config. Add game-specific facts to the registry and let both rendering paths consume them.

## URL rules

- The homepage canonical is `/`.
- Every other public page canonical ends in `/`.
- Internal links, sitemap entries, Open Graph URLs, JSON-LD URLs, and direct-game canonical tags must use that same form.
- `/games/<slug>/` is the playable file. Its canonical points to the descriptive `/<slug>/` landing page.

GitHub Pages redirects directory URLs to their trailing-slash form. Matching that form everywhere avoids unnecessary redirects and split canonical signals.

## Landing-page requirements

Each game page must visibly include:

- one descriptive `h1`
- original game summary and tagline
- free/no-download status
- a clear play action
- how-to-play steps, controls, and accurate tips
- descriptive artwork alt text and explicit image dimensions
- links to other playable missions

The iframe must not load or emit `Game Start` until the visitor presses Play. Never hide search-targeted copy only for crawlers.

Keep the static fallback text-only. An `<img>` in fallback markup is downloaded before React replaces it, which duplicates the responsive image request from the interactive page.

## Metadata and structured data

- Keep titles unique and roughly 65 characters or fewer.
- Keep descriptions specific, readable, and roughly 90–160 characters.
- Use the real game artwork for game shares and the wide site card for homepage/About shares.
- Keep `VideoGame`, `BreadcrumbList`, `WebSite`, and `ItemList` JSON-LD aligned with visible facts.
- Do not add review scores, player counts, awards, or other facts that are not visible and verifiable.
- Do not add meta keywords; major search engines do not use them for ranking.
- Do not invent sitemap `lastmod` dates. Add them only if they come from a trustworthy per-page modification source.

`npm run build` fails when canonical routes lose trailing slashes, a static fallback is missing, the sitemap contains synthetic metadata, or a playable game stops canonicalizing to its landing page.

## After deployment

These account-level steps cannot be completed from the repository:

1. Add `viggo.games` as a Domain property in Google Search Console and verify it with the provided DNS TXT record.
2. Submit `https://viggo.games/sitemap.xml` in Search Console.
3. Inspect `/`, each game landing page, and `/about/`; request indexing after the first deployment of major content changes.
4. Add or import the site in Bing Webmaster Tools, verify ownership, and submit the same sitemap.
5. Monitor indexed-page counts, search queries, page experience, and crawl errors monthly. Investigate exclusions instead of repeatedly requesting indexing.

## Earned discovery

Technical SEO makes pages indexable; relevant links make them easier to discover and rank. After launch:

- link to the site and individual games from the project owner’s existing website and relevant profiles
- keep the GitHub repository description and website field pointed at `https://viggo.games/`
- share individual game landing pages with communities where the game is genuinely relevant
- pursue a small number of editorial listings for browser games, family projects, or learn-to-code showcases

Avoid bulk directory submissions, paid link schemes, copied doorway pages, and mass-generated keyword pages.
