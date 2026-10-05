import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { burbTextureKinds } from '../../games/burb/src/textures';

const manifest = JSON.parse(readFileSync('games/burb/assets/manifest.json', 'utf8'));
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');

describe('Burb native texture parity', () => {
  it('requires rebaking native images when a shared texture recipe changes', () => {
    for (const [file, digest] of Object.entries(manifest.recipes)) {
      expect(hash(readFileSync(file)), `Rebake Burb textures after changing ${file}`).toBe(digest);
    }
  });

  it('bundles every shared texture with mipmap-compatible dimensions and verified pixels', () => {
    expect(Object.keys(manifest.textures)).toEqual([...burbTextureKinds]);
    for (const kind of burbTextureKinds) {
      const png = readFileSync(`games/burb/assets/${kind}.png`);
      const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
      expect(width & (width - 1)).toBe(0);
      expect(height & (height - 1)).toBe(0);
      expect({ width, height, sha256: hash(png) }).toEqual(manifest.textures[kind]);
    }
  });
});
