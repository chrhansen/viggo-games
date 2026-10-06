import fs from 'node:fs';

const sampleRate = 22050;
const frames = Math.round(sampleRate * 0.15);
const wav = Buffer.alloc(44 + frames * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
wav.writeUInt32LE(frames * 2, 40);
for (let i = 0; i < frames; i++) {
  const time = i / sampleRate;
  const gain = time < 0.015 ? time / 0.015 : Math.max(0, (0.14 - time) / 0.125);
  wav.writeInt16LE(Math.round(Math.sin(time * 740 * Math.PI * 2) * gain * 0.06 * 32767), 44 + i * 2);
}
const target = new URL('../games/gunny/assets/hull-warning.wav', import.meta.url);
if (process.argv.includes('--check')) {
  if (!fs.readFileSync(target).equals(wav)) throw new Error('Gunny warning audio is stale. Run node scripts/bake-gunny-audio.mjs');
} else fs.writeFileSync(target, wav);
