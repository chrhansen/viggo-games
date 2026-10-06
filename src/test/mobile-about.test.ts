import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import about from '../data/about.json';

describe('native About navigation and shared content', () => {
  it('opens About below the complete arcade list and on every game detail page', () => {
    const selector = fs.readFileSync('mobile/src/app/index.tsx', 'utf8');
    const detail = fs.readFileSync('mobile/src/app/game/[id].tsx', 'utf8');
    const link = fs.readFileSync('mobile/src/components/about-link.tsx', 'utf8');
    expect(selector.indexOf('<AboutLink')).toBeGreaterThan(selector.indexOf('gamePreviews.map'));
    expect(detail).toContain('<AboutLink />');
    expect(link).toContain("router.push('/about')");
    expect(link).toContain('minHeight: 48');
  });

  it('uses the browser copy and portrait with offline content and a safe direct-entry back route', () => {
    const screen = fs.readFileSync('mobile/src/app/about.tsx', 'utf8');
    expect(screen).toContain("../../../src/data/about.json");
    expect(screen).toContain("../../../src/assets/viggo-portrait.webp");
    for (const key of ['title', 'portraitAlt', 'intro', 'story', 'sourceIntro', 'sourceLabel', 'footer']) {
      expect(screen).toContain(`about.${key}`);
      expect(about[key as keyof typeof about]).toBeTruthy();
    }
    expect(screen).toContain('router.canGoBack()');
    expect(screen).toContain("router.replace('/')");
    expect(screen).not.toMatch(/Linking|WebView|fetch\(/);
  });
});
