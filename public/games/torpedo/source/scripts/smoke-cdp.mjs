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

  const target = await createTarget(appUrl);
  const client = await connectCdp(target.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const desktop = await runScenario(client, 'desktop');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  const mobile = await runScenario(client, 'mobile');
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
  await waitForExpression(client, 'document.readyState === "complete"');
  const report = await evaluate(client, smokeExpression(), true);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = join(tmpdir(), `torpedo-${label}-${Date.now()}.png`);
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
  return { ...report, screenshotPath };
}

function scenarioFailures(label, report) {
  return [
    [`${label} splash visible`, report.initialSplash],
    [`${label} canvas has size`, report.canvasWidth > 0 && report.canvasHeight > 0],
    [`${label} canvas has varied pixels`, report.distinctColors >= 3],
    [`${label} port view switch`, report.portTitle === 'Port Windows'],
    [`${label} starboard view switch`, report.starboardTitle === 'Starboard Windows'],
    [`${label} periscope switch`, report.periscopeActive],
    [`${label} interior opens`, report.interiorVisible],
    [`${label} interior movement`, report.roomAfterMove === 'Sonar Room'],
    [`${label} room view opens`, report.roomSceneVisible],
    [`${label} room action runs`, report.roomStatus.includes('contacts')],
    [`${label} plan returns`, report.planVisibleAgain],
    [`${label} combat returns`, report.combatBack]
  ].filter(([, passed]) => !passed);
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
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };
    const key = (code) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
    };

    const initialSplash = visible('#splash-screen');
    document.querySelector('#start-button').click();
    await wait(900);
    key('Space');
    await wait(160);
    key('Digit2');
    await wait(100);
    const portTitle = document.querySelector('#view-title').textContent;
    key('Digit3');
    await wait(100);
    const starboardTitle = document.querySelector('#view-title').textContent;
    key('KeyP');
    await wait(100);
    const periscopeActive = document.querySelector('#periscope-mask').classList.contains('active');
    key('KeyV');
    await wait(140);
    const interiorVisible = visible('#interior-screen');
    key('ArrowRight');
    await wait(140);
    const roomAfterMove = document.querySelector('#room-title').textContent;
    key('Enter');
    await wait(140);
    const roomSceneVisible = visible('#room-scene');
    key('Enter');
    await wait(140);
    const roomStatus = document.querySelector('#room-status').textContent;
    key('KeyV');
    await wait(140);
    const planVisibleAgain = visible('.submarine-cutaway');
    key('KeyV');
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
      portTitle,
      starboardTitle,
      periscopeActive,
      interiorVisible,
      roomAfterMove,
      roomSceneVisible,
      roomStatus,
      planVisibleAgain,
      combatBack,
      canvasWidth: gl.drawingBufferWidth,
      canvasHeight: gl.drawingBufferHeight,
      distinctColors: colors.size
    };
  })()`;
}
