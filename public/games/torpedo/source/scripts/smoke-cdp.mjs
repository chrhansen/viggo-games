import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const appPort = Number(process.env.SMOKE_PORT || 4173);
const debugPort = Number(process.env.CDP_PORT || 9224);
const appUrl = `http://127.0.0.1:${appPort}/`;
const chromePath = process.env.CHROME_PATH || defaultChromePath();
const roomImageRatio = 1216 / 864;

if (!chromePath) {
  throw new Error('Chrome not found. Set CHROME_PATH to run the smoke test.');
}

const vite = spawn(
  resolve(root, 'node_modules/.bin/vite'),
  ['--host', '127.0.0.1', '--port', String(appPort), '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }
);

const chrome = spawn(chromePath, [
  '--headless=new',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--enable-unsafe-swiftshader',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${join(tmpdir(), `torpedo-smoke-${Date.now()}`)}`,
  '--window-size=1280,800',
  'about:blank'
], { stdio: 'ignore' });

try {
  await waitForHttp(appUrl);
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);

  const desktopClient = await createPageClient();
  const desktop = await runScenario(desktopClient, 'desktop');

  const mobileClient = await createPageClient();
  await mobileClient.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  const mobile = await runScenario(mobileClient, 'mobile');
  const report = { desktop, mobile };

  const failures = [...scenarioFailures('desktop', desktop), ...scenarioFailures('mobile', mobile)];

  console.log(JSON.stringify(report, null, 2));

  if (failures.length) {
    throw new Error(`Smoke failed: ${failures.map(([name]) => name).join(', ')}`);
  }
} finally {
  chrome.kill();
  vite.kill();
}

async function runScenario(client, label) {
  await client.send('Page.navigate', { url: appUrl });
  await waitForExpression(client, `
    document.readyState === "complete"
      && typeof window.__torpedoDebugMotion === "function"
      && getComputedStyle(document.querySelector("#combat-ui")).position === "fixed"
  `);
  const report = await evaluate(client, smokeExpression(), true);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = join(tmpdir(), `torpedo-${label}-${Date.now()}.png`);
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
  return { ...report, screenshotPath };
}

async function createPageClient() {
  const target = await createTarget('about:blank');
  const client = await connectCdp(target.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  return client;
}

function scenarioFailures(label, report) {
  const failures = [
    [`${label} splash visible`, report.initialSplash],
    [`${label} canvas has size`, report.canvasWidth > 0 && report.canvasHeight > 0],
    [`${label} canvas has varied pixels`, report.distinctColors >= 3],
    [`${label} tougher hull`, report.initialHull === 'Hull 160'],
    [`${label} boss ladder hud`, report.initialBossStatus === 'Boss 0/5'],
    [`${label} fire button`, report.fireButtonFired],
    [`${label} motion permission requested`, report.motionPermissionAsked],
    [`${label} motion awaits sensor`, report.motionAfterRequest],
    [`${label} motion sensor connected`, report.motionSensorConnected],
    [`${label} motion axes swapped`, report.motionAxesSwapped],
    [`${label} motion turns off`, report.motionTurnedOff],
    [`${label} port view switch`, report.portTitle === 'Port Windows'],
    [`${label} starboard view switch`, report.starboardTitle === 'Starboard Windows'],
    [`${label} periscope enters`, report.periscopeActive],
    [`${label} periscope exits`, report.periscopeInactive],
    [`${label} interior opens`, report.interiorVisible],
    [`${label} plan rooms match images`, Math.abs(report.planRoomRatio - roomImageRatio) < 0.01],
    [`${label} interior movement`, report.roomAfterMove === 'Sonar Room'],
    [`${label} direct room tap`, report.directRoomTapTitle === 'Galley'],
    [`${label} room view opens`, report.roomSceneVisible],
    [`${label} room view matches images`, Math.abs(report.roomViewRatio - roomImageRatio) < 0.01],
    [`${label} room action runs`, report.roomStatus !== 'Ready'],
    [`${label} plan returns`, report.planVisibleAgain],
    [`${label} combat returns`, report.combatBack]
  ];

  if (label === 'mobile') {
    failures.push(
      ['mobile combat controls visible', report.combatControlsVisible],
      ['mobile room controls visible', report.roomControlsVisible],
      ['mobile motion toggle visible', report.motionToggleVisible],
      ['mobile periscope button visible', report.periscopeButtonVisible],
      ['mobile submarine map scrollable', report.cutawayScrollable],
      ['mobile submarine map drags', report.cutawayDragChanged]
    );
  }

  return failures.filter(([, passed]) => !passed);
}

function defaultChromePath() {
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
      : null;
  }
  return '/usr/bin/google-chrome';
}

async function waitForHttp(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function createTarget(url) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT'
  });
  if (!response.ok) {
    throw new Error(`Could not create Chrome target: ${response.status}`);
  }
  return response.json();
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;

  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolveMessage, rejectMessage } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      rejectMessage(new Error(message.error.message));
    } else {
      resolveMessage(message.result);
    }
  });

  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveMessage, rejectMessage) => {
        pending.set(id, { resolveMessage, rejectMessage });
      });
    }
  };
}

async function waitForExpression(client, expression) {
  for (let i = 0; i < 80; i += 1) {
    const result = await evaluate(client, expression);
    if (result) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function evaluate(client, expression, awaitPromise = false) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    const text = result.exceptionDetails.text || 'Runtime evaluation failed';
    throw new Error(text);
  }

  return result.result.value;
}

function smokeExpression() {
  return `(async () => {
    const wait = (ms) => new Promise((done) => setTimeout(done, ms));
    const visible = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const style = getComputedStyle(element);
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && style.opacity !== '0'
        && element.getClientRects().length > 0;
    };
    const key = (code) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
    };
    const pointerDown = (selector) => {
      document.querySelector(selector).dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: 'touch'
      }));
    };
    const pointer = (element, type, clientX) => {
      element.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 8,
        pointerType: 'touch',
        clientX
      }));
    };

    const initialSplash = visible('#splash-screen');
    document.querySelector('#start-button').click();
    await wait(900);
    const initialHull = document.querySelector('#health-meter').textContent;
    const initialBossStatus = document.querySelector('#level-meter').textContent;
    const combatControlsVisible = visible('#mobile-combat-controls');
    const motionToggleVisible = visible('#motion-toggle');
    const periscopeButtonVisible = visible('#periscope-button');
    let motionPermissionAsked = false;
    try {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        configurable: true,
        value: class TestDeviceOrientationEvent extends Event {
          static async requestPermission() {
            motionPermissionAsked = true;
            return 'granted';
          }
        }
      });
    } catch {}
    document.querySelector('#motion-toggle').click();
    await wait(80);
    const motionAfterRequest = document.querySelector('#motion-toggle').textContent === 'Move Phone'
      && document.querySelector('#motion-toggle').getAttribute('aria-pressed') === 'true';
    const orientationEvent = new Event('deviceorientation');
    Object.defineProperties(orientationEvent, {
      beta: { value: 14 },
      gamma: { value: 8 }
    });
    window.dispatchEvent(orientationEvent);
    const tiltedEvent = new Event('deviceorientation');
    Object.defineProperties(tiltedEvent, {
      beta: { value: 24 },
      gamma: { value: 18 }
    });
    window.dispatchEvent(tiltedEvent);
    await wait(80);
    const motionSensorConnected = document.querySelector('#motion-toggle').textContent === 'Tilt On';
    const motionVector = window.__torpedoDebugMotion?.();
    const motionAxesSwapped = motionVector?.x < 0 && motionVector?.y > 0;
    document.querySelector('#motion-toggle').click();
    await wait(80);
    const motionTurnedOff = document.querySelector('#motion-toggle').textContent === 'Motion'
      && document.querySelector('#motion-toggle').getAttribute('aria-pressed') === 'false';
    pointerDown('#fire-button');
    await wait(80);
    const fireButtonFired = document.querySelector('#charge-meter').textContent.includes('Reloading');
    key('Digit2');
    await wait(100);
    const portTitle = document.querySelector('#view-title').textContent;
    key('Digit3');
    await wait(100);
    const starboardTitle = document.querySelector('#view-title').textContent;
    document.querySelector('#periscope-button').click();
    await wait(100);
    const periscopeActive = document.querySelector('#periscope-mask').classList.contains('active');
    document.querySelector('#periscope-button').click();
    await wait(100);
    const periscopeInactive = !document.querySelector('#periscope-mask').classList.contains('active');
    document.querySelector('#rooms-button').click();
    await wait(140);
    const interiorVisible = visible('#interior-screen');
    const roomControlsVisible = visible('#mobile-room-controls');
    const planRoomRect = document.querySelector('.room[data-room="0"]').getBoundingClientRect();
    const planRoomRatio = planRoomRect.width / planRoomRect.height;
    const cutaway = document.querySelector('.submarine-cutaway');
    const cutawayScrollable = cutaway.scrollWidth > cutaway.clientWidth;
    const cutawayStartScroll = cutaway.scrollLeft;
    pointer(cutaway, 'pointerdown', 320);
    pointer(cutaway, 'pointermove', 120);
    pointer(cutaway, 'pointerup', 120);
    await wait(80);
    const cutawayDragChanged = cutaway.scrollLeft > cutawayStartScroll + 30;
    document.querySelector('#room-next').click();
    await wait(140);
    const roomAfterMove = document.querySelector('#room-title').textContent;
    document.querySelector('.room[data-room="3"]').click();
    await wait(140);
    const directRoomTapTitle = document.querySelector('#room-title').textContent;
    const roomSceneVisible = visible('#room-scene');
    const roomViewRect = document.querySelector('.room-back-wall').getBoundingClientRect();
    const roomViewRatio = roomViewRect.width / roomViewRect.height;
    document.querySelector('#room-enter').click();
    await wait(140);
    const roomStatus = document.querySelector('#room-status').textContent;
    document.querySelector('#room-back').click();
    await wait(140);
    const planVisibleAgain = visible('.submarine-cutaway');
    document.querySelector('#room-back').click();
    await wait(140);
    const combatBack = visible('#combat-ui') && !visible('#interior-screen');

    const canvas = document.querySelector('#combat-canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const samplePoints = [
      [0.18, 0.22], [0.5, 0.22], [0.82, 0.22],
      [0.18, 0.5], [0.5, 0.5], [0.82, 0.5],
      [0.18, 0.78], [0.5, 0.78], [0.82, 0.78]
    ];
    const pixel = new Uint8Array(4);
    const colors = new Set();
    for (const [xRatio, yRatio] of samplePoints) {
      const x = Math.floor(gl.drawingBufferWidth * xRatio);
      const y = Math.floor(gl.drawingBufferHeight * yRatio);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      colors.add(Array.from(pixel).join(','));
    }

    return {
      initialSplash,
      initialHull,
      initialBossStatus,
      combatControlsVisible,
      roomControlsVisible,
      motionToggleVisible,
      periscopeButtonVisible,
      fireButtonFired,
      motionPermissionAsked,
      motionAfterRequest,
      motionSensorConnected,
      motionAxesSwapped,
      motionTurnedOff,
      cutawayScrollable,
      cutawayDragChanged,
      portTitle,
      starboardTitle,
      periscopeActive,
      periscopeInactive,
      interiorVisible,
      planRoomRatio,
      roomAfterMove,
      directRoomTapTitle,
      roomSceneVisible,
      roomViewRatio,
      roomStatus,
      planVisibleAgain,
      combatBack,
      canvasWidth: gl.drawingBufferWidth,
      canvasHeight: gl.drawingBufferHeight,
      distinctColors: colors.size
    };
  })()`;
}
