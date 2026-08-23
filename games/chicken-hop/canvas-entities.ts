import type { ChickenHopGame } from "@viggo-games/chicken-hop-core";
import { clamp, roundedRect } from "./canvas-utils";

export function drawChickenHopEntities(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  drawPlatforms(context, game);
  drawEggs(context, game);
  drawPickups(context, game);
  drawObstacles(context, game);
}

function drawObstacles(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  for (const obstacle of game.obstacles) {
    context.globalAlpha = 0.25;
    roundedRect(
      context,
      obstacle.x + 6,
      game.floorY - 10,
      obstacle.width - 6,
      12,
      10,
    );
    context.fillStyle = "rgba(0,0,0,0.6)";
    context.fill();
    context.globalAlpha = 1;

    roundedRect(
      context,
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height,
      10,
    );
    const gradient = context.createLinearGradient(
      obstacle.x,
      obstacle.y,
      obstacle.x,
      obstacle.y + obstacle.height,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(0,0,0,0.12)");
    context.fillStyle = obstacle.color;
    context.fill();
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.25)";
    context.lineWidth = 2;
    context.stroke();

    context.save();
    context.globalAlpha = 0.65;
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.beginPath();
    context.arc(
      obstacle.x + obstacle.width * 0.35,
      obstacle.y + obstacle.height * 0.45,
      3.2,
      0,
      Math.PI * 2,
    );
    context.arc(
      obstacle.x + obstacle.width * 0.65,
      obstacle.y + obstacle.height * 0.45,
      3.2,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }
}

function drawPlatforms(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  for (const platform of game.platforms) {
    context.globalAlpha = 0.18;
    roundedRect(
      context,
      platform.x + 6,
      platform.y + platform.height + 6,
      platform.width - 12,
      10,
      8,
    );
    context.fillStyle = "rgba(0,0,0,0.65)";
    context.fill();
    context.globalAlpha = 1;

    if (platform.kind === "step") {
      roundedRect(
        context,
        platform.x,
        platform.y,
        platform.width,
        Math.max(platform.height, game.floorY - platform.y),
        10,
      );
      const gradient = context.createLinearGradient(
        platform.x,
        platform.y,
        platform.x,
        game.floorY,
      );
      gradient.addColorStop(0, "rgba(46, 229, 157, 0.34)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.12)");
      context.fillStyle = gradient;
      context.fill();
      context.strokeStyle = "rgba(255,255,255,0.18)";
      context.lineWidth = 2;
      context.stroke();
      roundedRect(
        context,
        platform.x,
        platform.y,
        platform.width,
        platform.height,
        10,
      );
      context.fillStyle = "rgba(255,255,255,0.10)";
      context.fill();
      context.globalAlpha = 0.25;
      context.strokeStyle = "rgba(0,0,0,0.55)";
      context.beginPath();
      context.moveTo(platform.x + 10, platform.y + platform.height);
      context.lineTo(
        platform.x + platform.width - 10,
        platform.y + platform.height,
      );
      context.stroke();
      context.globalAlpha = 1;
      continue;
    }

    roundedRect(
      context,
      platform.x,
      platform.y,
      platform.width,
      platform.height,
      10,
    );
    const gradient = context.createLinearGradient(
      platform.x,
      platform.y,
      platform.x,
      platform.y + platform.height,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0.18)");
    context.fillStyle = `hsla(${game.roomHueAccentTwo} 92% 60% / 0.22)`;
    context.fill();
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.22)";
    context.lineWidth = 2;
    context.stroke();
    context.save();
    context.globalAlpha = 0.3;
    context.fillStyle = "rgba(0,0,0,0.55)";
    for (let index = 0; index < 4; index += 1) {
      const x = platform.x + platform.width * (0.15 + index * 0.22);
      context.beginPath();
      context.arc(x, platform.y + platform.height + 2, 2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

function drawPickups(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    const isGold = pickup.kind === "gold-corn";
    const x = pickup.x;
    const y = pickup.y + Math.sin(pickup.elapsed * 7) * 6;
    context.save();
    context.globalAlpha = isGold ? 0.65 : 0.45;
    const glow = context.createRadialGradient(
      x,
      y,
      2,
      x,
      y,
      pickup.radius * 2.4,
    );
    glow.addColorStop(
      0,
      isGold
        ? "rgba(255, 214, 102, 0.75)"
        : "rgba(255, 214, 102, 0.55)",
    );
    glow.addColorStop(1, "rgba(255, 214, 102, 0.00)");
    context.fillStyle = glow;
    context.fillRect(
      x - pickup.radius * 2.4,
      y - pickup.radius * 2.4,
      pickup.radius * 4.8,
      pickup.radius * 4.8,
    );
    context.restore();

    context.save();
    context.translate(x, y);
    context.rotate(Math.sin(pickup.elapsed * 5) * (isGold ? 0.18 : 0.25));
    roundedRect(
      context,
      -pickup.radius * 0.9,
      -pickup.radius * 0.7,
      pickup.radius * 1.8,
      pickup.radius * 1.4,
      pickup.radius * 0.6,
    );
    context.fillStyle = isGold ? "#FFDF7A" : "#FFD166";
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.35)";
    context.lineWidth = 2;
    context.stroke();
    context.globalAlpha = 0.35;
    context.fillStyle = "#FFF7EA";
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.arc(
        -pickup.radius * 0.35 + index * pickup.radius * 0.18,
        -pickup.radius * 0.15 + (index % 2) * 2,
        1.2,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    if (isGold) {
      context.globalAlpha = 0.65;
      context.strokeStyle = "rgba(255,255,255,0.65)";
      context.beginPath();
      context.moveTo(0, -pickup.radius * 1.25);
      context.lineTo(0, -pickup.radius * 0.75);
      context.moveTo(-pickup.radius * 0.25, -pickup.radius);
      context.lineTo(pickup.radius * 0.25, -pickup.radius);
      context.stroke();
    }
    context.restore();
  }
}

function drawEggs(
  context: CanvasRenderingContext2D,
  game: ChickenHopGame,
) {
  for (const egg of game.eggs) {
    context.save();
    context.globalAlpha = 0.18;
    roundedRect(
      context,
      egg.x - egg.radius,
      game.floorY - 10,
      egg.radius * 2,
      10,
      8,
    );
    context.fillStyle = "rgba(0,0,0,0.65)";
    context.fill();
    context.restore();

    if (egg.smashed) {
      const progress = clamp(egg.smashedFor / 0.6, 0, 1);
      context.save();
      context.globalAlpha = 0.6 * (1 - progress);
      context.fillStyle = "rgba(255, 214, 102, 0.75)";
      context.beginPath();
      context.ellipse(
        egg.x,
        game.floorY - 8,
        egg.radius * 1.6,
        7,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
      continue;
    }

    context.save();
    context.translate(egg.x, egg.y);
    context.rotate(Math.sin(egg.elapsed * 3.2) * 0.06);
    context.fillStyle = "rgba(255,255,255,0.78)";
    context.strokeStyle = "rgba(0,0,0,0.18)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(0, 0, egg.radius * 0.92, egg.radius * 1.12, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.globalAlpha = 0.35;
    context.fillStyle = "#FFF7EA";
    context.beginPath();
    context.ellipse(
      -egg.radius * 0.28,
      -egg.radius * 0.25,
      egg.radius * 0.22,
      egg.radius * 0.38,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }
}
