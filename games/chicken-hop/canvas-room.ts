import type { ChickenHopGame } from "@viggo-games/chicken-hop-core";
import { roundedRect } from "./canvas-utils";

export function drawChickenHopRoom(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const width = game.width;
  const height = game.height;
  const wallGradient = context.createLinearGradient(0, 0, 0, game.floorY);
  wallGradient.addColorStop(0, `hsl(${game.roomHue} 44% 22%)`);
  wallGradient.addColorStop(1, `hsl(${game.roomHue + 18} 48% 14%)`);
  context.fillStyle = wallGradient;
  context.fillRect(0, 0, width, game.floorY);

  drawBunting(context, game);
  drawWallpaper(context, game);

  const windowWidth = Math.floor(width * 0.2);
  const windowHeight = Math.floor(height * 0.22);
  const windowY = Math.floor(height * 0.1);
  drawWindow(context, Math.floor(width * 0.08), windowY, windowWidth, windowHeight);
  drawWindow(context, Math.floor(width * 0.7), windowY, windowWidth, windowHeight);
  drawWallArt(context, game);
  drawFloor(context, game);
  drawSofa(context, game);
  drawLamp(context, game);
}

function drawBunting(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const y = Math.floor(game.height * 0.06);
  context.globalAlpha = 0.55;
  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, y);
  context.lineTo(game.width, y + 6);
  context.stroke();
  context.globalAlpha = 1;

  const flagCount = Math.floor(game.width / 46);
  for (let index = 0; index < flagCount; index += 1) {
    const x =
      (index / flagCount) * game.width + ((game.scroll * 0.1) % 46);
    const flagY = y + 6 + Math.sin(index * 0.8) * 2;
    context.fillStyle =
      index % 3 === 0
        ? `hsla(${game.roomHueAccent} 90% 60% / 0.45)`
        : index % 3 === 1
          ? `hsla(${game.roomHueAccentTwo} 90% 62% / 0.45)`
          : "hsla(42 95% 60% / 0.45)";
    context.beginPath();
    context.moveTo(x, flagY);
    context.lineTo(x + 18, flagY);
    context.lineTo(x + 9, flagY + 16);
    context.closePath();
    context.fill();
  }
}

function drawWallpaper(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const spacing = 38;
  const offset = -((game.scroll * 0.15) % spacing);
  for (let y = 16; y < game.floorY - 20; y += spacing) {
    for (let x = offset; x < game.width + spacing; x += spacing) {
      const index =
        Math.floor((x + 10000) / spacing) +
        Math.floor((y + 10000) / spacing);
      context.fillStyle =
        index % 3 === 0
          ? `hsla(${game.roomHueAccent} 92% 66% / 0.16)`
          : index % 3 === 1
            ? `hsla(${game.roomHueAccentTwo} 92% 66% / 0.14)`
            : "hsla(42 92% 66% / 0.14)";
      context.beginPath();
      context.arc(
        x + spacing * 0.5,
        y + spacing * 0.5,
        6,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
}

function drawWindow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  roundedRect(context, x, y, width, height, 14);
  context.fillStyle = "rgba(25, 40, 64, 0.85)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.22)";
  context.lineWidth = 3;
  context.stroke();

  context.save();
  context.globalAlpha = 0.9;
  const glow = context.createRadialGradient(
    x + width * 0.3,
    y + height * 0.35,
    10,
    x + width * 0.5,
    y + height * 0.5,
    width,
  );
  glow.addColorStop(0, "rgba(46, 229, 157, 0.25)");
  glow.addColorStop(1, "rgba(46, 229, 157, 0.00)");
  context.fillStyle = glow;
  context.fillRect(x, y, width, height);
  context.restore();

  context.strokeStyle = "rgba(255,255,255,0.20)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + width / 2, y);
  context.lineTo(x + width / 2, y + height);
  context.moveTo(x, y + height / 2);
  context.lineTo(x + width, y + height / 2);
  context.stroke();
}

function drawWallArt(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const width = Math.floor(game.width * 0.16);
  const height = Math.floor(game.height * 0.14);
  const y = Math.floor(game.height * 0.18);
  const frames = [
    [Math.floor(game.width * 0.38), game.roomHueAccent],
    [Math.floor(game.width * 0.56), game.roomHueAccentTwo],
  ];
  for (const [x, hue] of frames) {
    roundedRect(context, x, y, width, height, 14);
    context.fillStyle = "rgba(18,16,36,0.30)";
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.lineWidth = 3;
    context.stroke();

    roundedRect(context, x + 10, y + 10, width - 20, height - 20, 10);
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, `hsla(${hue} 92% 60% / 0.42)`);
    gradient.addColorStop(1, "rgba(255,255,255,0.06)");
    context.fillStyle = gradient;
    context.fill();
  }
}

function drawFloor(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const gradient = context.createLinearGradient(
    0,
    game.floorY,
    0,
    game.height,
  );
  gradient.addColorStop(0, "hsl(28 42% 22%)");
  gradient.addColorStop(1, "hsl(24 46% 12%)");
  context.fillStyle = gradient;
  context.fillRect(0, game.floorY, game.width, game.height - game.floorY);

  context.globalAlpha = 0.16;
  context.strokeStyle = "rgba(255,255,255,0.25)";
  context.lineWidth = 2;
  const plank = 52;
  const offset = -((game.scroll * 0.75) % plank);
  for (let x = offset; x < game.width + plank; x += plank) {
    context.beginPath();
    context.moveTo(x, game.floorY);
    context.lineTo(x, game.height);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.fillStyle = "rgba(0,0,0,0.35)";
  context.fillRect(0, game.floorY - 6, game.width, 6);

  const rugY =
    game.floorY + Math.floor((game.height - game.floorY) * 0.18);
  const rugHeight = Math.floor((game.height - game.floorY) * 0.6);
  const rugWidth = Math.floor(game.width * 0.92);
  const rugX =
    Math.floor((game.width - rugWidth) * 0.5) +
    Math.floor(Math.sin(game.scroll * 0.001) * 2);
  roundedRect(context, rugX, rugY, rugWidth, rugHeight, 16);
  context.fillStyle = `hsla(${game.roomHueAccent} 92% 56% / 0.12)`;
  context.fill();
  context.strokeStyle = `hsla(${game.roomHueAccentTwo} 92% 60% / 0.18)`;
  context.lineWidth = 2;
  context.stroke();

  context.save();
  context.globalAlpha = 0.25;
  for (let index = 0; index < 8; index += 1) {
    const stripeY = rugY + (index / 8) * rugHeight;
    context.fillStyle =
      index % 2 === 0
        ? `hsla(${game.roomHueAccent} 92% 58% / 0.60)`
        : `hsla(${game.roomHueAccentTwo} 92% 60% / 0.55)`;
    context.fillRect(rugX + 10, stripeY, rugWidth - 20, rugHeight / 8);
  }
  context.restore();
}

function drawSofa(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  context.save();
  context.globalAlpha = 0.55;
  roundedRect(
    context,
    Math.floor(game.width * 0.64),
    Math.floor(game.floorY - game.height * 0.06),
    Math.floor(game.width * 0.3),
    Math.floor(game.height * 0.1),
    16,
  );
  context.fillStyle = "rgba(0,0,0,0.35)";
  context.fill();
  context.restore();
}

function drawLamp(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  const x = Math.floor(game.width * 0.12);
  const y = Math.floor(game.floorY - game.height * 0.18);
  context.save();
  context.globalAlpha = 0.45;
  context.strokeStyle = "rgba(0,0,0,0.45)";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x, game.floorY);
  context.stroke();
  roundedRect(context, x - 22, y - 30, 44, 30, 10);
  context.fillStyle = "rgba(0,0,0,0.35)";
  context.fill();
  context.globalAlpha = 0.12;
  context.fillStyle = "rgba(255, 214, 102, 0.75)";
  context.beginPath();
  context.moveTo(x - 18, y);
  context.lineTo(x + 18, y);
  context.lineTo(x + 80, game.floorY);
  context.lineTo(x - 80, game.floorY);
  context.closePath();
  context.fill();
  context.restore();
}

export function drawChickenHopForeground(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  context.save();
  const vignette = context.createRadialGradient(
    game.width * 0.5,
    game.height * 0.55,
    Math.min(game.width, game.height) * 0.2,
    game.width * 0.5,
    game.height * 0.55,
    Math.max(game.width, game.height) * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.28)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, game.width, game.height);
  context.restore();
  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = "rgba(255,255,255,0.7)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, game.floorY + 14);
  context.lineTo(game.width, game.floorY + 14);
  context.stroke();
  context.restore();
}
