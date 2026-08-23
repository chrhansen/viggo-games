import { useEffect } from "react";
import type { Game } from "@/data/games";
import {
  absoluteUrl,
  createAboutSeo,
  createGameSeo,
  createHomeSeo,
  createNotFoundSeo,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo-config.js";

export { absoluteUrl, DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_URL };

type JsonLd = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "article";
  robots?: string;
  jsonLd?: JsonLd[];
}

export const homeSeo = (games: Game[]): SeoConfig => createHomeSeo(games);

export const aboutSeo = (): SeoConfig => createAboutSeo();

export const gameSeo = (game: Game): SeoConfig => createGameSeo(game);

export const notFoundSeo = (): SeoConfig => createNotFoundSeo();

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
  setMeta("property", "og:image:alt", config.imageAlt ?? `${config.title} preview image`);
  setOptionalMeta("property", "og:image:width", config.imageWidth);
  setOptionalMeta("property", "og:image:height", config.imageHeight);

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", config.title);
  setMeta("name", "twitter:description", config.description);
  setMeta("name", "twitter:image", absoluteUrl(config.image ?? DEFAULT_SOCIAL_IMAGE));
  setMeta("name", "twitter:image:alt", config.imageAlt ?? `${config.title} preview image`);

  document.querySelectorAll("script[data-seo-jsonld]").forEach((element) => element.remove());

  config.jsonLd?.forEach((jsonLd) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoJsonld = "true";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  });
};

const setOptionalMeta = (
  attribute: "name" | "property",
  key: string,
  content: number | undefined,
) => {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (content === undefined) {
    existing?.remove();
    return;
  }

  setMeta(attribute, key, String(content));
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
