import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8080/');
  const textures = await page.evaluate(async () => {
    const { generateNatureTexture, generateSkyTexture } = await import('/games/hunter-guy/texture-art.js');
    const result = {};
    for (const kind of ['ground', 'bark', 'fur', 'needles', 'leaves']) {
      result[kind] = generateNatureTexture(kind).image.toDataURL('image/png').split(',')[1];
    }
    result.sky = generateSkyTexture().image.toDataURL('image/png').split(',')[1];
    return result;
  });
  await mkdir('games/hunter-guy/assets', { recursive: true });
  for (const [kind, data] of Object.entries(textures)) {
    await writeFile(`games/hunter-guy/assets/${kind}.png`, Buffer.from(data, 'base64'));
  }
} finally { await browser.close(); }
