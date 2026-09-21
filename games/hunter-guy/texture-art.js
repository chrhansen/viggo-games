import * as THREE from "three";
import { seededRandom } from "./core/world.js";

export function generateNatureTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(112);
  if (kind === "needles" || kind === "leaves") {
    ctx.strokeStyle = "#8c8060";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(256, 500);
    ctx.lineTo(256, 35);
    ctx.stroke();
    for (let i = 0; i < 350; i++) {
      const y = 35 + random() * 450;
      const spread = Math.sin((y / 512) * Math.PI) * 215;
      const x = 256 + (random() - 0.5) * spread * 2;
      ctx.strokeStyle = `hsl(${80 + random() * 30}, ${22 + random() * 20}%, ${26 + random() * 34}%)`;
      ctx.fillStyle = ctx.strokeStyle;
      if (kind === "leaves") {
        ctx.beginPath();
        ctx.ellipse(x, y, 9 + random() * 10, 5 + random() * 5, random() * 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 2 + random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (x - 256) * 0.14, y - 18 - random() * 35);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = kind === "bark" ? "#a39a86" : kind === "ground" ? "#858476" : "#c5b9a3";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 24000; i++) {
      const x = random() * 512;
      const y = random() * 512;
      const shade = Math.floor(kind === "fur" ? 145 + random() * 85 : 55 + random() * 180);
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.1 + random() * 0.4})`;
      ctx.lineWidth = kind === "bark" ? 1 + random() * 5 : 0.7 + random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * (kind === "ground" ? 22 : 4), y + random() * (kind === "bark" ? 95 : 14));
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (kind !== "needles" && kind !== "leaves") {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
  return texture;
}


export function generateSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#4c85b4");
  gradient.addColorStop(0.48, "#b9ccca");
  gradient.addColorStop(1, "#b9ccca");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  const random = seededRandom(91);
  for (let cloud = 0; cloud < 18; cloud++) {
    const x = 80 + random() * 860, y = 65 + random() * 135;
    for (let puff = 0; puff < 5; puff++) {
      const glow = ctx.createRadialGradient(x + puff * 13, y, 1, x + puff * 13, y, 34);
      glow.addColorStop(0, "rgba(249,245,230,0.22)");
      glow.addColorStop(1, "rgba(249,245,230,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x + puff * 13 - 34, y - 34, 68, 68);
    }
  }
  return new THREE.CanvasTexture(canvas);
}
