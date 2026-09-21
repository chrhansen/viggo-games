import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
  for (const weapon of ['rifle', 'bow', 'knife', 'squirt']) {
    const samples = await page.evaluate(async (weapon) => {
      const { createWeaponSoundEffects } = await import('/games/hunter-guy/weapon-sfx.js');
      const context = new OfflineAudioContext(1, 22050, 22050);
      function Context() { return context; }
      createWeaponSoundEffects(Context).play(weapon);
      const buffer = await context.startRendering();
      return Array.from(buffer.getChannelData(0));
    }, weapon);
    const wav = Buffer.alloc(44 + samples.length * 2);
    wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(22050, 24); wav.writeUInt32LE(44100, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
    wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40);
    samples.forEach((sample, index) => wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + index * 2));
    await writeFile(`games/hunter-guy/assets/${weapon}.wav`, wav);
  }
} finally { await browser.close(); }
