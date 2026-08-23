import type { ChickenHopGame, ChickenProfile } from "@viggo-games/chicken-hop-core";
import { clamp, lerp, roundedRect } from "./canvas-utils";

const palettes = {
  butter: {
    beak: "#FFD166",
    body: "#FFF7EA",
    comb: "#FF4B3A",
    ink: "rgba(0,0,0,0.18)",
    wing: "#FDE6C5",
  },
  red: {
    beak: "#FFD166",
    body: "#FF6A5B",
    comb: "#C81D25",
    ink: "rgba(0,0,0,0.20)",
    wing: "#FFD2CD",
  },
  blue: {
    beak: "#FFD166",
    body: "#4CC9F0",
    comb: "#FF4B3A",
    ink: "rgba(0,0,0,0.20)",
    wing: "#D7F4FF",
  },
  green: {
    beak: "#FFD166",
    body: "#2EE59D",
    comb: "#FF4B3A",
    ink: "rgba(0,0,0,0.20)",
    wing: "#D9FFF0",
  },
  grape: {
    beak: "#FFD166",
    body: "#9B5DE5",
    comb: "#FF4B3A",
    ink: "rgba(0,0,0,0.22)",
    wing: "#EADBFF",
  },
  charcoal: {
    beak: "#FFD166",
    body: "#34324A",
    comb: "#FF4B3A",
    ink: "rgba(0,0,0,0.22)",
    wing: "#A9A7B8",
  },
} as const;

export function drawChickenHopPlayer(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
  profile: ChickenProfile,
) {
  const player = game.player;
  if (
    player.invulnerableFor > 0 &&
    Math.floor(game.elapsed * 16) % 2 === 0
  ) {
    context.globalAlpha = 0.55;
  }

  const shadowWidth = player.width * 0.9;
  const air = clamp(
    (game.floorY - (player.y + player.height)) / 120,
    0,
    1,
  );
  context.save();
  context.globalAlpha = lerp(0.28, 0.1, air);
  roundedRect(
    context,
    player.x + (player.width - shadowWidth) * 0.5,
    game.floorY - 9,
    shadowWidth,
    12,
    10,
  );
  context.fillStyle = "rgba(0,0,0,0.65)";
  context.fill();
  context.restore();

  const run = player.onGround ? Math.sin(player.animation * 10) : 0;
  const bounce = player.onGround ? Math.abs(run) * 2 : -2;
  const tilt = player.onGround
    ? run * 0.04
    : clamp(player.vy / 1200, -0.22, 0.18);
  const palette = palettes[profile.color];
  context.save();
  context.translate(
    player.x + player.width * 0.5,
    player.y + player.height * 0.6 + bounce,
  );
  context.rotate(tilt);
  context.fillStyle = palette.body;
  context.strokeStyle = palette.ink;
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.globalAlpha = 0.12;
  context.fillStyle = "#FF6A3D";
  context.beginPath();
  context.ellipse(2, 4, 18, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  drawDesign(context, profile);

  const wingFlap = player.onGround
    ? run * 0.18
    : Math.sin(game.elapsed * 16) * 0.28;
  context.save();
  context.translate(-6, 2);
  context.rotate(wingFlap);
  context.fillStyle = palette.wing;
  context.beginPath();
  context.ellipse(0, 0, 12, 8, 0.2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();

  context.fillStyle = palette.body;
  context.beginPath();
  context.ellipse(18, -12, 12, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = palette.comb;
  context.beginPath();
  context.moveTo(15, -26);
  context.quadraticCurveTo(18, -34, 22, -26);
  context.quadraticCurveTo(25, -34, 28, -26);
  context.quadraticCurveTo(30, -18, 22, -18);
  context.closePath();
  context.fill();
  context.fillStyle = palette.beak;
  context.beginPath();
  context.moveTo(30, -10);
  context.lineTo(40, -7);
  context.lineTo(30, -4);
  context.closePath();
  context.fill();
  context.fillStyle =
    profile.design === "robot"
      ? "rgba(76, 201, 240, 0.85)"
      : "rgba(0,0,0,0.55)";
  context.beginPath();
  context.arc(22, -12, 2.4, 0, Math.PI * 2);
  context.fill();

  const legKick = player.onGround ? run * 7 : 0;
  context.strokeStyle = "#FFD166";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-6, 14);
  context.lineTo(-8, 20 + legKick * 0.06);
  context.stroke();
  context.beginPath();
  context.moveTo(6, 14);
  context.lineTo(9, 20 - legKick * 0.06);
  context.stroke();

  if (Math.abs(player.vx) > 220 && player.onGround) {
    context.globalAlpha = 0.25;
    context.strokeStyle = "rgba(255,255,255,0.45)";
    context.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      context.beginPath();
      context.moveTo(-30 - index * 8, -4 + index * 6);
      context.lineTo(-44 - index * 8, -2 + index * 6);
      context.stroke();
    }
  }
  context.restore();
  context.globalAlpha = 1;
}

function drawDesign(
  context: CanvasRenderingContext2D,
  profile: ChickenProfile,
) {
  if (profile.design === "spots") {
    context.save();
    context.globalAlpha = 0.28;
    context.fillStyle = "rgba(0,0,0,0.35)";
    for (let index = 0; index < 6; index += 1) {
      context.beginPath();
      context.arc(
        -10 + index * 4,
        -2 + (index % 2) * 6,
        2.8,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  } else if (profile.design === "flame") {
    context.save();
    context.globalAlpha = 0.4;
    const gradient = context.createLinearGradient(-26, -18, 26, 18);
    gradient.addColorStop(0, "rgba(255, 214, 102, 0.55)");
    gradient.addColorStop(0.6, "rgba(255, 106, 61, 0.55)");
    gradient.addColorStop(1, "rgba(255, 59, 48, 0.50)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.save();
    context.globalAlpha = 0.55;
    context.fillStyle = "rgba(255, 106, 61, 0.65)";
    for (let index = 0; index < 3; index += 1) {
      context.beginPath();
      context.moveTo(-22 - index * 4, -6 + index * 4);
      context.quadraticCurveTo(
        -34 - index * 6,
        -14 + index * 4,
        -26 - index * 4,
        2 + index * 4,
      );
      context.closePath();
      context.fill();
    }
    context.restore();
  } else if (profile.design === "robot") {
    context.save();
    const gradient = context.createLinearGradient(-22, -16, 22, 16);
    gradient.addColorStop(0, "rgba(255,255,255,0.22)");
    gradient.addColorStop(0.45, "rgba(180,180,200,0.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0.14)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.55;
    context.strokeStyle = "rgba(0,0,0,0.25)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-10, -8);
    context.lineTo(10, -8);
    context.moveTo(-14, 0);
    context.lineTo(14, 0);
    context.stroke();
    context.restore();
  }
}

export function drawChickenHopName(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
  name: string,
) {
  if (!name) return;
  const x = game.player.x + game.player.width * 0.5;
  const y = game.player.y - 10;
  context.save();
  context.font = '18px "Chalkboard SE", "Marker Felt", ui-rounded, cursive';
  context.textAlign = "center";
  context.textBaseline = "bottom";
  const width = Math.max(46, Math.ceil(context.measureText(name).width + 20));
  roundedRect(context, x - width / 2, y - 26, width, 26, 10);
  context.fillStyle = "rgba(18, 16, 36, 0.52)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 2;
  context.stroke();
  context.lineWidth = 5;
  context.strokeStyle = "rgba(0,0,0,0.35)";
  context.strokeText(name, x, y - 6);
  context.fillStyle = "#FFF7EA";
  context.fillText(name, x, y - 6);
  context.restore();
}
