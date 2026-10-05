import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Run against the root Vite server; native assets come from the browser recipes.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8080/');
  const textures = await page.evaluate(async () => {
    const { createBrowserBurbTexture } = await import('/games/burb/src/browser-textures.ts');
    const { burbTextureKinds } = await import('/games/burb/src/textures.ts');
    return Object.fromEntries(burbTextureKinds.map((kind) => {
      const texture = createBrowserBurbTexture(kind);
      const canvas = document.createElement('canvas');
      canvas.width = 2 ** Math.ceil(Math.log2(texture.image.width));
      canvas.height = 2 ** Math.ceil(Math.log2(texture.image.height));
      canvas.getContext('2d').drawImage(texture.image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/png').split(',')[1];
      texture.dispose();
      return [kind, data];
    }));
  });
  await mkdir('games/burb/assets', { recursive: true });
  const recipes = ['games/burb/src/texture-art.ts', 'games/burb/src/browser-textures.ts', 'scripts/bake-burb-textures.mjs'];
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  const manifest = {
    recipes: Object.fromEntries(await Promise.all(recipes.map(async (file) => [file, hash(await readFile(file))]))),
    textures: {},
  };
  for (const [kind, data] of Object.entries(textures)) {
    const file = `games/burb/assets/${kind}.png`;
    const pixels = Buffer.from(data, 'base64');
    manifest.textures[kind] = { sha256: hash(pixels), width: pixels.readUInt32BE(16), height: pixels.readUInt32BE(20) };
    if (process.argv.includes('--check')) {
      if (!(await readFile(file)).equals(pixels)) throw new Error(`${file} differs from its browser recipe. Run node scripts/bake-burb-textures.mjs.`);
    } else {
      await writeFile(file, pixels);
    }
  }
  if (!process.argv.includes('--check')) {
    await writeFile('games/burb/assets/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  }
  console.log(`${Object.keys(textures).length} Burb textures ${process.argv.includes('--check') ? 'verified' : 'baked'}.`);
} finally {
  await browser.close();
}
