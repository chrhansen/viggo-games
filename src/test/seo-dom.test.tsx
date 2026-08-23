import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { gamesById } from "@/data/games";
import { gameSeo, type SeoConfig, usePageSeo } from "@/lib/seo";

const SeoProbe = ({ config }: { config: SeoConfig }) => {
  usePageSeo(config);
  return null;
};

describe("runtime SEO tags", () => {
  beforeEach(() => {
    document.head
      .querySelectorAll(
        'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[data-seo-jsonld]',
      )
      .forEach((element) => element.remove());
  });

  it("replaces metadata and structured data during client-side navigation", async () => {
    const gameConfig = gameSeo(gamesById.gunny);
    const { rerender } = render(<SeoProbe config={gameConfig} />);

    await waitFor(() => expect(document.title).toBe(gameConfig.title));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://viggo.games/gunny/",
    );
    expect(document.head.querySelector('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      String(gamesById.gunny.imageWidth),
    );
    expect(document.head.querySelectorAll("script[data-seo-jsonld]")).toHaveLength(2);

    const plainConfig: SeoConfig = {
      title: "Plain page | viggo.games",
      description: "A plain page without image dimensions.",
      path: "/plain/",
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage" }],
    };
    rerender(<SeoProbe config={plainConfig} />);

    await waitFor(() => expect(document.title).toBe(plainConfig.title));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://viggo.games/plain/",
    );
    expect(document.head.querySelector('meta[property="og:image:width"]')).not.toBeInTheDocument();
    expect(document.head.querySelector('meta[property="og:image:height"]')).not.toBeInTheDocument();
    expect(document.head.querySelectorAll("script[data-seo-jsonld]")).toHaveLength(1);
  });
});
