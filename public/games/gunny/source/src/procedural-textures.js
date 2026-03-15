import * as THREE from "three";

const textureCache = {};

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeTexture(width, height, draw, colorSpace = THREE.NoColorSpace) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawBlob(context, x, y, radiusX, radiusY, turns) {
  context.beginPath();
  for (let index = 0; index <= turns; index += 1) {
    const angle = (index / turns) * Math.PI * 2;
    const variance = 0.76 + Math.sin(angle * 3.4) * 0.12 + Math.cos(angle * 5.1) * 0.1;
    const px = x + Math.cos(angle) * radiusX * variance;
    const py = y + Math.sin(angle) * radiusY * variance;
    if (index === 0) {
      context.moveTo(px, py);
    } else {
      context.lineTo(px, py);
    }
  }
  context.closePath();
}

function getGradient(context, width, height, top, bottom) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  return gradient;
}

export function getEarthMaps() {
  if (textureCache.earth) {
    return textureCache.earth;
  }

  const rand = createSeededRandom(73421);

  const map = makeTexture(
    2048,
    1024,
    (context, width, height) => {
      context.fillStyle = getGradient(context, width, height, "#2a70da", "#113674");
      context.fillRect(0, 0, width, height);

      for (let band = 0; band < 18; band += 1) {
        context.fillStyle = `rgba(255,255,255,${0.015 + rand() * 0.03})`;
        context.fillRect(0, band * 56, width, 14 + rand() * 22);
      }

      for (let index = 0; index < 20; index += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const radiusX = 80 + rand() * 140;
        const radiusY = 34 + rand() * 92;

        context.save();
        context.translate(x, y);
        context.rotate(rand() * Math.PI * 2);
        drawBlob(context, 0, 0, radiusX, radiusY, 18);
        context.fillStyle = rand() > 0.45 ? "#3e9453" : "#85744f";
        context.fill();
        context.fillStyle = "rgba(111, 171, 96, 0.58)";
        context.scale(0.84, 0.84);
        drawBlob(context, 0, 0, radiusX, radiusY, 18);
        context.fill();
        context.restore();
      }

      context.fillStyle = "rgba(238, 248, 255, 0.78)";
      context.fillRect(0, 0, width, 72);
      context.fillRect(0, height - 72, width, 72);
    },
    THREE.SRGBColorSpace
  );

  const emissiveMap = makeTexture(
    2048,
    1024,
    (context, width, height) => {
      context.fillStyle = "black";
      context.fillRect(0, 0, width, height);

      for (let index = 0; index < 4500; index += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const radius = rand() * 1.8 + 0.2;

        context.fillStyle = rand() > 0.4 ? "rgba(255, 187, 88, 0.34)" : "rgba(255, 224, 181, 0.28)";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    },
    THREE.SRGBColorSpace
  );

  const cloudMap = makeTexture(
    2048,
    1024,
    (context, width, height) => {
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < 170; index += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const radiusX = 40 + rand() * 120;
        const radiusY = 14 + rand() * 38;

        context.save();
        context.translate(x, y);
        context.rotate(rand() * Math.PI * 2);
        drawBlob(context, 0, 0, radiusX, radiusY, 18);
        context.fillStyle = `rgba(255,255,255,${0.1 + rand() * 0.2})`;
        context.fill();
        context.restore();
      }
    },
    THREE.SRGBColorSpace
  );

  textureCache.earth = { map, emissiveMap, cloudMap };
  return textureCache.earth;
}

export function getMoonMaps() {
  if (textureCache.moon) {
    return textureCache.moon;
  }

  const rand = createSeededRandom(1984);

  const map = makeTexture(
    1024,
    1024,
    (context, width, height) => {
      context.fillStyle = getGradient(context, width, height, "#b6b7bc", "#70737a");
      context.fillRect(0, 0, width, height);

      for (let index = 0; index < 440; index += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const radius = 6 + rand() * 32;

        context.fillStyle = "rgba(84, 86, 93, 0.24)";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(210, 213, 219, 0.22)";
        context.lineWidth = 2 + rand() * 2;
        context.beginPath();
        context.arc(x, y, radius * 0.92, 0, Math.PI * 2);
        context.stroke();
      }
    },
    THREE.SRGBColorSpace
  );

  const bumpMap = makeTexture(1024, 1024, (context, width, height) => {
    context.fillStyle = "#808080";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 440; index += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const radius = 6 + rand() * 32;

      context.fillStyle = "rgba(70, 70, 70, 0.25)";
      context.beginPath();
      context.arc(x, y, radius * 0.86, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(190, 190, 190, 0.24)";
      context.lineWidth = 2 + rand() * 2;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
    }
  });

  textureCache.moon = { map, bumpMap };
  return textureCache.moon;
}

export function getSolarPanelMaps() {
  if (textureCache.solarPanels) {
    return textureCache.solarPanels;
  }

  const panelMap = makeTexture(
    1024,
    256,
    (context, width, height) => {
      context.fillStyle = "#0a2238";
      context.fillRect(0, 0, width, height);

      for (let x = 0; x < width; x += 64) {
        context.fillStyle = "rgba(51, 118, 178, 0.26)";
        context.fillRect(x + 6, 10, 52, height - 20);
      }

      context.strokeStyle = "rgba(118, 184, 232, 0.65)";
      context.lineWidth = 2;
      for (let x = 0; x <= width; x += 64) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }

      for (let y = 0; y <= height; y += 32) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
    },
    THREE.SRGBColorSpace
  );

  const panelEmissiveMap = makeTexture(
    1024,
    256,
    (context, width, height) => {
      context.fillStyle = "#07131f";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(74, 156, 220, 0.36)";

      for (let x = 0; x < width; x += 64) {
        context.fillRect(x + 10, 14, 46, height - 28);
      }
    },
    THREE.SRGBColorSpace
  );

  textureCache.solarPanels = { panelMap, panelEmissiveMap };
  return textureCache.solarPanels;
}
