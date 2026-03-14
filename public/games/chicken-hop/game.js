/* Chicken Hop: single-file canvas game.
   Goals: kid-friendly; keyboard + touch; no deps; runs from file or simple server.
*/

(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const ui = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    corn: document.getElementById('corn'),
    speedMode: document.getElementById('speedMode'),
    nameInput: document.getElementById('nameInput'),
    nameRandom: document.getElementById('nameRandom'),
    designBtns: document.getElementById('designBtns'),
    colorBtns: document.getElementById('colorBtns'),
    hpRect1: document.getElementById('hpRect1'),
    hpFill1: document.getElementById('hpFill1'),
    hpRect2: document.getElementById('hpRect2'),
    hpFill2: document.getElementById('hpFill2'),
    overlay: document.getElementById('overlay'),
    cta: document.getElementById('cta'),
    touchControls: document.getElementById('touchControls'),
    touchLeft: document.getElementById('touchLeft'),
    touchRight: document.getElementById('touchRight'),
    touchJump: document.getElementById('touchJump'),
    touchDown: document.getElementById('touchDown'),
    touchPause: document.getElementById('touchPause'),
    touchRestart: document.getElementById('touchRestart'),
  };
  const touchButtons = Array.from(document.querySelectorAll('[data-touch]'));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));

  function nowMs() {
    return performance.now();
  }

  function detectTouchMode() {
    const coarse = !!(window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);
    return coarse || ((navigator.maxTouchPoints || 0) > 0);
  }

  const touchMode = detectTouchMode();
  if (touchMode) {
    document.body.classList.add('touch-mode');
    if (ui.touchControls) ui.touchControls.setAttribute('aria-hidden', 'false');
  }

  function roundedRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // --- Audio (optional, user gesture unlock on start) ---
  const Sfx = (() => {
    let ac = null;
    let resumeP = null;

    function ensure() {
      try {
        if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') {
          if (!resumeP) {
            resumeP = ac.resume().catch(() => {}).finally(() => { resumeP = null; });
          }
        }
        return ac.state === 'running';
      } catch {
        return false;
      }
    }

    function runWhenRunning(fn) {
      if (!ac) return;
      if (ac.state === 'running') { fn(); return; }
      ensure();
      if (ac.state === 'running') { fn(); return; }
      if (resumeP) resumeP.then(() => { if (ac && ac.state === 'running') fn(); });
    }

    function beep({ freq = 440, dur = 0.08, type = 'square', gain = 0.06, bend = 0 }) {
      if (!ac) return;
      runWhenRunning(() => {
        const t0 = ac.currentTime + 0.01;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (bend !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + bend), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g);
        g.connect(ac.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
      });
    }

    function noisePop({ dur = 0.08, gain = 0.05 }) {
      if (!ac) return;
      runWhenRunning(() => {
        const sr = ac.sampleRate;
        const len = Math.floor(sr * dur);
        const buf = ac.createBuffer(1, len, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
        }
        const src = ac.createBufferSource();
        const g = ac.createGain();
        g.gain.setValueAtTime(gain, ac.currentTime + 0.01);
        src.buffer = buf;
        src.connect(g);
        g.connect(ac.destination);
        src.start(ac.currentTime + 0.01);
      });
    }

    return {
      ensure,
      jump() { beep({ freq: 520, dur: 0.07, type: 'square', gain: 0.05, bend: 160 }); },
      land() { beep({ freq: 180, dur: 0.06, type: 'triangle', gain: 0.04, bend: -40 }); },
      corn() { beep({ freq: 880, dur: 0.06, type: 'sine', gain: 0.05, bend: 200 }); },
      ouch() { beep({ freq: 240, dur: 0.08, type: 'square', gain: 0.04, bend: -80 }); },
      egg() { noisePop({ dur: 0.06, gain: 0.03 }); beep({ freq: 160, dur: 0.06, type: 'triangle', gain: 0.025, bend: -20 }); },
      cluckFast() { beep({ freq: rand(420, 520), dur: 0.05, type: 'square', gain: 0.028, bend: 120 }); },
      cluckSlow() { beep({ freq: rand(280, 360), dur: 0.06, type: 'triangle', gain: 0.030, bend: 40 }); },
      bonk() { noisePop({ dur: 0.10, gain: 0.07 }); beep({ freq: 90, dur: 0.10, type: 'sawtooth', gain: 0.03, bend: -10 }); },
      start() { beep({ freq: 330, dur: 0.08, type: 'square', gain: 0.04, bend: 240 }); },
    };
  })();

  // --- Responsive canvas ---
  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(320, Math.floor(rect.width * dpr));
    const h = Math.max(240, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  window.addEventListener('resize', fitCanvas, { passive: true });
  fitCanvas();

  // --- Input ---
  const keys = new Set();
  const touchState = { left: false, right: false, jump: false, down: false };
  const touchCounts = { left: 0, right: 0, jump: 0, down: 0 };
  const touchPointers = new Map();
  let lastInputAt = 0;

  function syncTouchVisuals() {
    for (const btn of touchButtons) {
      const action = btn.getAttribute('data-touch');
      if (!action || !(action in touchState)) continue;
      btn.classList.toggle('active', touchState[action]);
    }
  }

  function clearTouchInput() {
    for (const k of Object.keys(touchState)) {
      touchState[k] = false;
      touchCounts[k] = 0;
    }
    touchPointers.clear();
    syncTouchVisuals();
  }

  function clearInputState() {
    keys.clear();
    clearTouchInput();
  }

  function setTouchAction(action, pointerId, active) {
    if (!(action in touchState)) return;
    const prev = touchPointers.get(pointerId);
    if (prev && prev !== action && (prev in touchCounts)) {
      touchCounts[prev] = Math.max(0, touchCounts[prev] - 1);
      touchState[prev] = touchCounts[prev] > 0;
    }
    if (!active) {
      if (prev && prev in touchCounts) {
        touchCounts[prev] = Math.max(0, touchCounts[prev] - 1);
        touchState[prev] = touchCounts[prev] > 0;
      }
      touchPointers.delete(pointerId);
      syncTouchVisuals();
      return;
    }

    if (prev === action) return;
    touchPointers.set(pointerId, action);
    touchCounts[action] += 1;
    touchState[action] = true;
    syncTouchVisuals();
  }

  function releaseTouchPointer(pointerId) {
    const prev = touchPointers.get(pointerId);
    if (!prev || !(prev in touchCounts)) return;
    touchCounts[prev] = Math.max(0, touchCounts[prev] - 1);
    touchState[prev] = touchCounts[prev] > 0;
    touchPointers.delete(pointerId);
    syncTouchVisuals();
  }

  function togglePause() {
    if (state.mode === 'playing') {
      state.mode = 'paused';
      clearInputState();
      showOverlay('Paused', touchMode ? 'Tap to continue' : 'Press P to continue');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      clearInputState();
      hideOverlay();
    }
  }

  function pressRestart() {
    clearInputState();
    if (state.mode !== 'playing') startGame();
    else resetRun();
  }

  function setupTouchButtons() {
    if (!touchMode) return;

    const press = (e) => {
      const btn = e.currentTarget;
      const action = btn && btn.getAttribute && btn.getAttribute('data-touch');
      if (!action) return;
      e.preventDefault();
      lastInputAt = nowMs();
      setTouchAction(action, e.pointerId, true);
      if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
      if (state.mode !== 'title') Sfx.ensure();
    };

    const release = (e) => {
      releaseTouchPointer(e.pointerId);
    };

    for (const btn of touchButtons) {
      btn.addEventListener('pointerdown', press, { passive: false });
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
    }

    window.addEventListener('pointerup', (e) => releaseTouchPointer(e.pointerId));
    window.addEventListener('pointercancel', (e) => releaseTouchPointer(e.pointerId));
  }

  function keyDown(e) {
    const k = e.key;
    const isTyping = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (!isTyping && [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      ' ', 'Enter', 'p', 'P', 'r', 'R', '1', '2', '3',
      'a', 'A', 'd', 'D', 'w', 'W', 's', 'S',
    ].includes(k)) {
      e.preventDefault();
    }

    keys.add(k);
    lastInputAt = nowMs();

    if (k === 'Enter') {
      if (state.mode === 'title' || state.mode === 'gameover') startGame();
    }

    if (!isTyping && (k === '1' || k === '2' || k === '3')) {
      if (k === '1') setTimeMode('slow');
      else if (k === '2') setTimeMode('normal');
      else setTimeMode('fast');
    }

    if (k === 'p' || k === 'P') {
      togglePause();
    }

    if (k === 'r' || k === 'R') {
      pressRestart();
    }

    // Unlock audio once.
    if (state.mode !== 'title') Sfx.ensure();
  }

  function keyUp(e) {
    keys.delete(e.key);
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', clearInputState);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInputState();
  });
  setupTouchButtons();

  if (ui.touchPause) {
    ui.touchPause.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      togglePause();
    }, { passive: false });
  }

  if (ui.touchRestart) {
    ui.touchRestart.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pressRestart();
    }, { passive: false });
  }

  if (ui.cta) {
    ui.cta.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.mode === 'title' || state.mode === 'gameover') startGame();
      else if (state.mode === 'paused') togglePause();
    });
  }

  // --- Game state ---
  const storageKey = 'chicken_hop_best_v1';
  const nameKey = 'chicken_hop_name_v1';
  const lookKey = 'chicken_hop_look_v1';
  const state = {
    mode: 'title',
    t: 0,
    dt: 0,
    timeScale: 1.0,
    timeMode: 'normal',
    speed: 360,
    difficulty: 0,
    score: 0,
    best: 0,
    corn: 0,
    heartsMax: 2,
    heartIndex: 0,
    hearts: [100, 100],
    heartsSmooth: [100, 100],
    name: 'Nugget',
    design: 'classic',
    color: 'butter',
    flyFuelMax: 5.0,
    flyFuel: 5.0,
    flyRefuelDelay: 0.75,
    flyRefuelCd: 0,
    shake: 0,
    hintBlink: 0,
  };

  function startCtaText() {
    return touchMode ? 'Tap to start' : 'Press <b>Enter</b> to start';
  }

  function retryCtaText() {
    return touchMode ? 'Tap to try again' : 'Press Enter to try again';
  }

  function setTimeMode(mode) {
    const m = String(mode || '').toLowerCase();
    if (m === 'slow') { state.timeScale = 0.55; state.timeMode = 'slow'; }
    else if (m === 'fast') { state.timeScale = 1.6; state.timeMode = 'fast'; }
    else { state.timeScale = 1.0; state.timeMode = 'normal'; }

    if (ui.speedMode) {
      ui.speedMode.textContent = state.timeMode === 'slow' ? 'Slow' : (state.timeMode === 'fast' ? 'Fast' : 'Normal');
    }
  }

  try {
    const best = Number(localStorage.getItem(storageKey) || '0');
    if (Number.isFinite(best)) state.best = best;
  } catch {}

  function normalizeName(v) {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    const cut = s.slice(0, 14);
    return cut.length ? cut : 'Nugget';
  }

  function setName(next) {
    state.name = normalizeName(next);
    try { localStorage.setItem(nameKey, state.name); } catch {}
  }

  function randomName() {
    const pool = [
      'Nugget', 'Peep', 'Waffles', 'Biscuit', 'Sunny', 'Pip', 'Popcorn',
      'Beans', 'Doodle', 'Sprinkles', 'Captain Cluck', 'Turbo Beak',
    ];
    setName(pool[randi(0, pool.length - 1)]);
    if (ui.nameInput) ui.nameInput.value = state.name;
  }

  function normalizeLook(v, allowed, fallback) {
    const s = String(v ?? '').trim().toLowerCase();
    return allowed.includes(s) ? s : fallback;
  }

  function setLook({ design, color }) {
    state.design = normalizeLook(design, ['classic', 'spots', 'flame', 'robot'], 'classic');
    state.color = normalizeLook(color, ['butter', 'red', 'blue', 'green', 'grape', 'charcoal'], 'butter');
    try { localStorage.setItem(lookKey, JSON.stringify({ design: state.design, color: state.color })); } catch {}
    syncLookButtons();
  }

  function syncLookButtons() {
    if (ui.designBtns) {
      for (const b of ui.designBtns.querySelectorAll('[data-design]')) {
        const v = b.getAttribute('data-design');
        b.setAttribute('aria-pressed', v === state.design ? 'true' : 'false');
      }
    }
    if (ui.colorBtns) {
      for (const b of ui.colorBtns.querySelectorAll('[data-color]')) {
        const v = b.getAttribute('data-color');
        b.setAttribute('aria-pressed', v === state.color ? 'true' : 'false');
      }
    }
  }

  try {
    const saved = localStorage.getItem(nameKey);
    if (saved) state.name = normalizeName(saved);
  } catch {}

  try {
    const raw = localStorage.getItem(lookKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.design = normalizeLook(parsed.design, ['classic', 'spots', 'flame', 'robot'], 'classic');
      state.color = normalizeLook(parsed.color, ['butter', 'red', 'blue', 'green', 'grape', 'charcoal'], 'butter');
    }
  } catch {}

  if (ui.nameInput) {
    ui.nameInput.value = state.name;
    ui.nameInput.addEventListener('input', (e) => setName(e.target.value));
  }
  if (ui.nameRandom) ui.nameRandom.addEventListener('click', () => randomName());

  if (ui.designBtns) {
    ui.designBtns.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('[data-design]');
      if (!btn) return;
      setLook({ design: btn.getAttribute('data-design'), color: state.color });
    });
  }
  if (ui.colorBtns) {
    ui.colorBtns.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('[data-color]');
      if (!btn) return;
      setLook({ design: state.design, color: btn.getAttribute('data-color') });
    });
  }
  syncLookButtons();

  // World dimensions are canvas-based; recompute each frame.
  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 54,
    h: 44,
    onGround: true,
    jumpBuffered: 0,
    coyote: 0,
    anim: 0,
    invuln: 0,
    ground: null, // null or platform reference
    drop: 0, // drop-through timer for one-way platforms
    cluckCd: 0,
    flyHold: 0,
  };

  const world = {
    floorY: 0,
    leftBound: 0,
    rightBound: 0,
    gravity: 2400,
    // Slightly shorter jump (less hang time) to avoid \"chain landings\" at higher speed.
    jumpVel: -760,
    scroll: 0,
    roomHue: 22,
    popHue: 160,
    popHue2: 320,
    plateauLift: 96,
  };

  const obstacles = [];
  const platforms = [];
  const pickups = [];
  const eggs = [];
  const particles = [];
  // Spawner fairness: obstacles come in \"chunks\" (1-2 obstacles) with a guaranteed landing gap between chunks.
  // Prevents impossible chains where you can't clear or land.
  const spawner = { cd: 0.35, runChunksLeft: 0, needLanding: false };
  const platformSpawner = { cd: 1.4 };
  const eggSpawner = { cd: 1.2 };
  const terrain = { level: 0, runLeft: 0 };

  function resetRun() {
    fitCanvas();
    {
      const W = canvas.width;
      const H = canvas.height;
      world.floorY = Math.floor(H * 0.78);
      world.leftBound = Math.floor(W * 0.08);
      world.rightBound = Math.floor(W * 0.62);
      player.x = world.leftBound + Math.floor(W * 0.16);
      player.y = world.floorY - player.h;
    }

    obstacles.length = 0;
    platforms.length = 0;
    pickups.length = 0;
    eggs.length = 0;
    particles.length = 0;
    spawner.cd = 0.35;
    spawner.runChunksLeft = 0;
    spawner.needLanding = false;
    platformSpawner.cd = 1.4;
    eggSpawner.cd = 1.2;
    terrain.level = 0;
    terrain.runLeft = 0;

    state.t = 0;
    state.dt = 0;
    state.speed = 360;
    state.difficulty = 0;
    state.score = 0;
    state.corn = 0;
    state.heartIndex = 0;
    state.hearts[0] = 100;
    state.hearts[1] = 100;
    state.heartsSmooth[0] = 100;
    state.heartsSmooth[1] = 100;
    state.shake = 0;
    state.hintBlink = 0;
    state.flyFuel = state.flyFuelMax;
    state.flyRefuelCd = 0;
    setTimeMode(state.timeMode);

    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumpBuffered = 0;
    player.coyote = 0;
    player.anim = 0;
    player.invuln = 0;
    player.ground = null;
    player.drop = 0;
    player.cluckCd = 0;
    player.flyHold = 0;

    world.scroll = 0;
    world.roomHue = randi(14, 34);
    world.popHue = (world.roomHue + randi(110, 190)) % 360;
    world.popHue2 = (world.roomHue + randi(220, 300)) % 360;
  }

  function setHeartFill(idx, hp01) {
    const hp = clamp(hp01, 0, 1);
    const fill = idx === 0 ? ui.hpFill1 : ui.hpFill2;
    const rect = idx === 0 ? ui.hpRect1 : ui.hpRect2;
    if (fill) fill.style.opacity = String(lerp(0.10, 1.0, hp));
    if (!rect) return;
    const fullH = 24;
    const h = Math.max(0, Math.round(fullH * hp));
    const y = fullH - h;
    rect.setAttribute('y', String(y));
    rect.setAttribute('height', String(h));
  }

  function hurt(obstacle, amount = 12) {
    if (state.mode !== 'playing') return;
    if (player.invuln > 0) return;

    const obstacleCenterX = obstacle.x + obstacle.w * 0.5;
    state.hearts[state.heartIndex] = Math.max(0, state.hearts[state.heartIndex] - amount);
    player.invuln = 1.0;
    state.shake = Math.max(state.shake, 0.10);

    const pMid = player.x + player.w * 0.5;
    const dir = pMid < obstacleCenterX ? -1 : 1;
    player.vx = 320 * dir;
    player.vy = Math.min(player.vy, -380);
    player.onGround = false;
    // Prevent sitting inside the obstacle and taking repeated hits.
    if (dir < 0) player.x = obstacle.x - player.w - 10;
    else player.x = obstacle.x + obstacle.w + 10;
    player.x = clamp(player.x, world.leftBound, world.rightBound);

    featherBurst(player.x + player.w * 0.55, player.y + player.h * 0.55);
    Sfx.ouch();

    if (state.hearts[state.heartIndex] <= 0) {
      if (state.heartIndex < state.heartsMax - 1) {
        state.hearts[state.heartIndex] = 0;
        state.heartIndex += 1;
        state.hearts[state.heartIndex] = 100;
        state.heartsSmooth[state.heartIndex] = 100;
        player.invuln = 1.2;
        state.shake = 0.18;
      } else {
        gameOver();
      }
    }
  }

  function startGame() {
    Sfx.ensure();
    Sfx.start();
    if (ui.nameInput) setName(ui.nameInput.value);
    resetRun();
    state.mode = 'playing';
    hideOverlay();
  }

  function gameOver() {
    state.mode = 'gameover';
    state.best = Math.max(state.best, Math.floor(state.score));
    try { localStorage.setItem(storageKey, String(state.best)); } catch {}
    showOverlay(`Bonk, ${state.name}!`, retryCtaText());
    Sfx.bonk();
  }

  function showOverlay(titleText, ctaText, subtitleText) {
    ui.overlay.classList.remove('hidden');
    const title = ui.overlay.querySelector('.title');
    const subtitle = ui.overlay.querySelector('.subtitle');
    if (title) title.textContent = titleText;
    if (subtitle) subtitle.textContent = subtitleText || 'Run inside the house. Jump the clutter. Grab the corn.';
    if (ui.cta) ui.cta.innerHTML = ctaText;
  }

  function hideOverlay() {
    ui.overlay.classList.add('hidden');
  }

  // --- Spawning ---
  const obstacleTypes = [
    { kind: 'block', w: 46, h: 34, color: '#ff6a3d' },
    { kind: 'book', w: 54, h: 22, color: '#2ee59d' },
    { kind: 'robot', w: 52, h: 40, color: '#ffd166' },
    { kind: 'plant', w: 42, h: 44, color: '#7ef08a' },
  ];

  function spawnPlatform(w, y, x, kind = 'shelf') {
    const h = 18;
    platforms.push({
      x: x ?? (canvas.width + rand(120, 220)),
      y,
      w,
      h,
      kind,
      bob: 0,
    });
  }

  function spawnStairs(levelFrom, levelTo, startX) {
    const stepRise = 16;
    const stepW = 78;

    const liftFrom = levelFrom === 1 ? world.plateauLift : 0;
    const liftTo = levelTo === 1 ? world.plateauLift : 0;
    const delta = liftTo - liftFrom;
    if (delta === 0) return startX;

    const steps = clamp(Math.ceil(Math.abs(delta) / stepRise), 3, 7);
    const dir = Math.sign(delta);
    for (let i = 0; i < steps; i++) {
      const lift = liftFrom + dir * stepRise * (i + 1);
      const y = world.floorY - Math.round(lift);
      spawnPlatform(stepW, y, startX + i * stepW, 'step');
    }
    return startX + steps * stepW;
  }

  function spawnObstacle(w, h, kind, color, x) {
    obstacles.push({
      x: x ?? (canvas.width + rand(40, 120)),
      y: world.floorY - h,
      w,
      h,
      kind,
      color,
      bob: rand(0, Math.PI * 2),
    });
  }

  function spawnCorn(x) {
    const size = randi(14, 18);
    const lift = randi(64, 118);
    pickups.push({
      x: x ?? (canvas.width + rand(60, 180)),
      y: world.floorY - lift,
      r: size,
      t: 0,
      taken: false,
      kind: 'corn',
      value: 1,
    });
  }

  function spawnBigCorn(x) {
    const size = randi(20, 26);
    const lift = randi(170, 250);
    pickups.push({
      x: x ?? (canvas.width + rand(120, 260)),
      y: world.floorY - lift,
      r: size,
      t: 0,
      taken: false,
      kind: 'big',
      value: 3,
    });
  }

  function spawnEgg(x) {
    const r = randi(12, 15);
    eggs.push({
      x: x ?? (canvas.width + rand(120, 260)),
      y: world.floorY - r,
      r,
      t: 0,
      smashed: false,
      smashT: 0,
    });
  }

  function featherBurst(x, y) {
    const n = randi(7, 11);
    for (let i = 0; i < n; i++) {
      particles.push({
        x,
        y,
        vx: rand(-240, 240),
        vy: rand(-520, -120),
        life: rand(0.35, 0.65),
        t: 0,
        kind: 'feather',
        rot: rand(0, Math.PI * 2),
        vr: rand(-10, 10),
      });
    }
  }

  function dustPuff(x, y) {
    const n = randi(6, 10);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-6, 6),
        vx: rand(-140, 140),
        vy: rand(-220, -40),
        life: rand(0.25, 0.45),
        t: 0,
        kind: 'dust',
      });
    }
  }

  function yolkBurst(x, y) {
    const n = randi(10, 16);
    for (let i = 0; i < n; i++) {
      particles.push({
        x,
        y,
        vx: rand(-260, 260),
        vy: rand(-520, -160),
        life: rand(0.25, 0.45),
        t: 0,
        kind: 'yolk',
      });
    }
  }

  // --- Update ---
  function update(dt) {
    state.dt = dt;
    state.t += dt;

    fitCanvas();
    const W = canvas.width;
    const H = canvas.height;

    world.floorY = Math.floor(H * 0.78);
    world.leftBound = Math.floor(W * 0.08);
    world.rightBound = Math.floor(W * 0.62);

    if (state.mode !== 'playing') {
      // Subtle title idle motion.
      state.hintBlink += dt;
      for (let i = 0; i < state.heartsMax; i++) {
        const target = state.mode === 'title' ? 100 : state.hearts[i];
        state.heartsSmooth[i] = lerp(state.heartsSmooth[i], target, 1 - Math.pow(0.00001, dt));
        setHeartFill(i, state.heartsSmooth[i] / 100);
      }
      return;
    }

    // Difficulty ramps gently.
    state.difficulty = clamp(state.difficulty + dt * 0.035, 0, 1);
    state.speed = lerp(360, 620, state.difficulty);

    // Score.
    state.score += dt * (20 + state.speed * 0.02);

    // Damage cooldown + UI smoothing.
    player.invuln = Math.max(0, player.invuln - dt);
    for (let i = 0; i < state.heartsMax; i++) {
      state.heartsSmooth[i] = lerp(state.heartsSmooth[i], state.hearts[i], 1 - Math.pow(0.00001, dt));
      setHeartFill(i, state.heartsSmooth[i] / 100);
    }

    // Input -> movement.
    const left = touchState.left || keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = touchState.right || keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const jump = touchState.jump || keys.has(' ') || keys.has('ArrowUp') || keys.has('w') || keys.has('W');
    const down = touchState.down || keys.has('ArrowDown') || keys.has('s') || keys.has('S');

    const accel = 2400;
    const maxVx = 360;
    if (left) player.vx -= accel * dt;
    if (right) player.vx += accel * dt;
    if (!left && !right) player.vx *= Math.pow(0.0006, dt); // strong friction
    player.vx = clamp(player.vx, -maxVx, maxVx);

    // Jump buffer + coyote time.
    if (jump) player.jumpBuffered = 0.12;
    else player.jumpBuffered = Math.max(0, player.jumpBuffered - dt);

    if (player.onGround) player.coyote = 0.10;
    else player.coyote = Math.max(0, player.coyote - dt);

    // Fly hold timer (tap = jump; hold = flight).
    if (jump) player.flyHold += dt;
    else player.flyHold = 0;

    if (player.jumpBuffered > 0 && player.coyote > 0) {
      player.jumpBuffered = 0;
      player.coyote = 0;
      player.onGround = false;
      player.vy = world.jumpVel;
      featherBurst(player.x + player.w * 0.6, player.y + player.h * 0.5);
      Sfx.jump();
    }

    // Flight (Up/W hold): limited fuel.
    const isFlying = jump && !player.onGround && player.flyHold > 0.14 && state.flyFuel > 0;
    if (isFlying) {
      state.flyFuel = Math.max(0, state.flyFuel - dt);
      state.flyRefuelCd = state.flyRefuelDelay;
      // Pull velocity upward gently, feels like \"flap\" lift.
      const targetVy = -420;
      player.vy = lerp(player.vy, targetVy, 1 - Math.pow(0.001, dt));
      if (Math.random() < 0.35) featherBurst(player.x + player.w * 0.45, player.y + player.h * 0.75);
    }

    // Cluck SFX: right = faster, left = slower (only when on ground).
    player.cluckCd = Math.max(0, player.cluckCd - dt);
    if (player.onGround && (right || left) && player.cluckCd <= 0) {
      if (right) {
        Sfx.cluckFast();
        player.cluckCd = rand(0.14, 0.22);
      } else {
        Sfx.cluckSlow();
        player.cluckCd = rand(0.26, 0.40);
      }
    }

    // Drop through shelves.
    player.drop = Math.max(0, player.drop - dt);
    if (down && player.onGround && player.ground) {
      player.drop = 0.35;
      player.ground = null;
      player.onGround = false;
      player.vy = Math.max(player.vy, 120);
    }

    // Physics.
    const wasOnGround = player.onGround;
    const prevY = player.y;
    player.vy += world.gravity * dt;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Ceiling clamp (don't fly off-screen).
    const ceilY = Math.floor(H * 0.06);
    if (player.y < ceilY) {
      player.y = ceilY;
      player.vy = Math.max(player.vy, 0);
    }

    // Keep player inside the \"lane\" before any platform checks.
    player.x = clamp(player.x, world.leftBound, world.rightBound);

    // Scroll world.
    world.scroll += state.speed * dt;

    // Spawner: varied, but always clearable.
    // Rules:
    // - Obstacles spawn in chunks of 1-2.
    // - Between chunks: guaranteed landing gap (pixel-based).
    // - Runs are multiple chunks (so you can get 4 obstacles as 2+2 with a landing gap).
    spawner.cd -= dt;
    let iters = 0;
    while (spawner.cd <= 0 && iters++ < 6) {
      const speedFactor = lerp(1.00, 0.86, state.difficulty);

      if (spawner.runChunksLeft <= 0) {
        const startRun = Math.random() < lerp(0.50, 0.72, state.difficulty);
        if (!startRun) {
          spawner.needLanding = false;
          spawner.cd += rand(0.55, 1.25) * speedFactor;
          if (Math.random() < 0.16) spawner.cd += rand(0.70, 1.40) * speedFactor;
          continue;
        }
        spawner.runChunksLeft = randi(1, 2 + (state.difficulty > 0.55 ? 1 : 0));
        spawner.needLanding = false;
      }

      let chunkSize = Math.random() < lerp(0.30, 0.55, state.difficulty) ? 2 : 1;
      if (state.difficulty < 0.10) chunkSize = 1;

      const lastObs = obstacles[obstacles.length - 1];
      const lastEndX = lastObs ? (lastObs.x + lastObs.w) : null;
      const minSpacingPx = lerp(240, 180, state.difficulty);
      // Landing gap: must exceed how far the world moves during a full jump, plus a reaction buffer.
      // Keeps patterns beatable even as speed ramps.
      const airTime = (2 * Math.abs(world.jumpVel)) / world.gravity;
      const jumpTravelPx = state.speed * airTime;
      const reactionPx = lerp(220, 140, state.difficulty);
      const landingSpacingPx = Math.max(player.w + 200, jumpTravelPx + reactionPx);
      const reqPx = spawner.needLanding ? landingSpacingPx : minSpacingPx;

      const pick = () => obstacleTypes[randi(0, obstacleTypes.length - 1)];
      const makeWH = (t) => {
        const big = state.difficulty > 0.55 && Math.random() < 0.12;
        return {
          t,
          w: big ? Math.floor(t.w * 1.25) : t.w,
          h: big ? Math.floor(t.h * 1.35) : t.h,
        };
      };

      let x1 = W + rand(40, 140);
      if (lastEndX != null) x1 = Math.max(x1, lastEndX + reqPx);
      const o1 = makeWH(pick());
      spawnObstacle(o1.w, o1.h, o1.t.kind, o1.t.color, x1);

      let chunkEndX = x1 + o1.w;

      if (chunkSize === 2) {
        // Keep pairs tight so a single jump can clear both.
        const pairGapPx = rand(40, 80);
        const x2 = x1 + o1.w + pairGapPx;
        const o2 = makeWH(pick());
        spawnObstacle(o2.w, o2.h, o2.t.kind, o2.t.color, x2);
        chunkEndX = x2 + o2.w;
      }

      if (Math.random() < (chunkSize === 2 ? 0.38 : 0.62)) spawnCorn(chunkEndX + rand(90, 240));
      // Rare giant corn: higher up, worth 3 corn.
      if (Math.random() < lerp(0.02, 0.05, state.difficulty)) spawnBigCorn(chunkEndX + rand(240, 420));

      spawner.runChunksLeft -= 1;
      if (spawner.runChunksLeft > 0) {
        spawner.needLanding = true;
        spawner.cd += rand(0.20, 0.40) * speedFactor;
      } else {
        spawner.needLanding = false;
        spawner.cd += rand(0.55, 1.10) * speedFactor;
      }
    }

    // Shelves + stairs (readable segments during \"break\" time).
    platformSpawner.cd -= dt;
    if (platformSpawner.cd <= 0 && spawner.needLanding === false && spawner.runChunksLeft === 0) {
      const speedFactor = lerp(1.00, 0.86, state.difficulty);

      if (terrain.runLeft <= 0) {
        const start = Math.random() < lerp(0.42, 0.62, state.difficulty);
        if (!start) {
          platformSpawner.cd = rand(1.3, 2.8) * speedFactor;
        } else {
          terrain.runLeft = randi(2, 4);
        }
      }

      if (terrain.runLeft > 0) {
        const lastObs = obstacles[obstacles.length - 1];
        const lastPlat = platforms[platforms.length - 1];
        const lastEnd = Math.max(
          lastObs ? (lastObs.x + lastObs.w) : 0,
          lastPlat ? (lastPlat.x + lastPlat.w) : 0,
        );

        const chainGap = terrain.runLeft >= 2 ? rand(160, 240) : rand(280, 420);
        let x = Math.max(W + rand(180, 280), lastEnd + chainGap);

        // Plateau height constant. Terrain level: 0 (floor) or 1 (plateau).
        let toLevel = terrain.level;
        if (terrain.level === 0) {
          toLevel = 1; // never spawn shelves on the floor
        } else {
          // When on the plateau: sometimes end the run by going down.
          if (terrain.runLeft <= 1 && Math.random() < 0.78) toLevel = 0;
          else toLevel = 1;
        }

        if (toLevel !== terrain.level) x = spawnStairs(terrain.level, toLevel, x) + 18;

        if (toLevel === 1) {
          const y = world.floorY - world.plateauLift;
          const w = randi(300, 460);
          spawnPlatform(w, y, x, 'shelf');

          // Corn on top sometimes.
          if (Math.random() < 0.58) spawnCorn(x + w * 0.5);
          if (Math.random() < 0.10) spawnBigCorn(x + w * 0.65);
        }

        terrain.level = toLevel;
        terrain.runLeft -= 1;
        platformSpawner.cd = (terrain.runLeft > 0 ? rand(0.55, 0.95) : rand(2.2, 3.6)) * speedFactor;
      }
    }

    // Eggs: ground hazards, score penalty only. Spawn mostly during breaks (readable).
    eggSpawner.cd -= dt;
    if (eggSpawner.cd <= 0 && spawner.needLanding === false && spawner.runChunksLeft === 0) {
      const lastObs = obstacles[obstacles.length - 1];
      const lastPlat = platforms[platforms.length - 1];
      const lastEgg = eggs[eggs.length - 1];
      const lastEnd = Math.max(
        lastObs ? (lastObs.x + lastObs.w) : 0,
        lastPlat ? (lastPlat.x + lastPlat.w) : 0,
        lastEgg ? (lastEgg.x + lastEgg.r) : 0,
      );

      // Keep eggs out of the immediate landing zone after obstacles/shelves.
      const x = Math.max(W + rand(220, 380), lastEnd + rand(360, 560));
      if (Math.random() < 0.70) spawnEgg(x);

      const speedFactor = lerp(1.00, 0.86, state.difficulty);
      eggSpawner.cd = rand(1.4, 2.8) * speedFactor;
    }

    // Update obstacles.
    for (const o of obstacles) {
      o.x -= state.speed * dt;
    }
    while (obstacles.length && obstacles[0].x + obstacles[0].w < -40) obstacles.shift();

    // Update platforms.
    for (const p of platforms) {
      p.x -= state.speed * dt;
    }
    while (platforms.length && platforms[0].x + platforms[0].w < -60) platforms.shift();

    // Update pickups.
    for (const p of pickups) {
      p.x -= state.speed * dt;
      p.t += dt;
    }
    while (pickups.length && pickups[0].x + pickups[0].r < -60) pickups.shift();

    // Update eggs.
    for (const e of eggs) {
      e.x -= state.speed * dt;
      e.t += dt;
      if (e.smashed) e.smashT += dt;
    }
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i];
      if (e.x + e.r < -60) eggs.splice(i, 1);
      else if (e.smashed && e.smashT > 0.60) eggs.splice(i, 1);
    }

    // Particles.
    for (const prt of particles) {
      prt.t += dt;
      prt.x += prt.vx * dt;
      prt.y += prt.vy * dt;
      prt.vy += (prt.kind === 'dust' ? 1200 : 1800) * dt;
      if (prt.rot != null) prt.rot += prt.vr * dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].t >= particles[i].life) particles.splice(i, 1);
    }

    // Shelf + floor collision (one-way shelves).
    // Keep support if standing on a moving shelf.
    if (player.ground && player.onGround) {
      const gp = player.ground;
      const overlap = (player.x + player.w) > gp.x + 6 && player.x < (gp.x + gp.w - 6);
      if (!overlap) {
        player.ground = null;
        player.onGround = false;
        player.vy = Math.max(player.vy, 80);
      } else {
        player.y = gp.y - player.h;
        player.vy = 0;
      }
    }

    let landed = false;
    if (player.vy >= 0 && player.drop <= 0) {
      const prevBottom = prevY + player.h;
      const bottom = player.y + player.h;
      for (const p of platforms) {
        if (bottom < p.y || prevBottom > p.y) continue;
        const overlap = (player.x + player.w - 6) > p.x && (player.x + 6) < (p.x + p.w);
        if (!overlap) continue;
        // Only land if crossing the top surface from above.
        if (prevBottom <= p.y && bottom >= p.y) {
          player.y = p.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.ground = p;
          landed = true;
          if (!wasOnGround) dustPuff(player.x + player.w * 0.4, p.y + 2);
          break;
        }
      }
    }

    // Landing on obstacles is safe (like blocks). Damage only happens from the front.
    if (!landed && player.vy >= 0) {
      const prevBottom = prevY + player.h;
      const bottom = player.y + player.h;
      for (const o of obstacles) {
        if (bottom < o.y || prevBottom > o.y) continue;
        const overlap = (player.x + player.w - 6) > o.x && (player.x + 6) < (o.x + o.w);
        if (!overlap) continue;
        if (prevBottom <= o.y && bottom >= o.y) {
          player.y = o.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.ground = o;
          landed = true;
          if (!wasOnGround) dustPuff(player.x + player.w * 0.4, o.y + 2);
          break;
        }
      }
    }

    if (!landed) {
      // Floor.
      if (player.y + player.h >= world.floorY) {
        player.y = world.floorY - player.h;
        if (!wasOnGround && player.vy > 0) {
          dustPuff(player.x + player.w * 0.4, world.floorY);
          Sfx.land();
        }
        player.vy = 0;
        player.onGround = true;
        player.ground = null;
      } else {
        // In air (unless already grounded on shelf above).
        if (!player.ground) player.onGround = false;
      }
    }

    // Flight refuel: short delay on ground, then instant full fuel.
    if (state.flyFuel < state.flyFuelMax) {
      if (player.onGround) {
        state.flyRefuelCd = Math.max(0, state.flyRefuelCd - dt);
        if (state.flyRefuelCd <= 0) state.flyFuel = state.flyFuelMax;
      }
    }

    // Animation.
    const runSpeed = player.onGround ? (Math.abs(player.vx) / 220 + 1.0) : 0.4;
    player.anim += dt * runSpeed;

    // Collisions.
    const hitbox = {
      x: player.x + 8,
      y: player.y + 8,
      w: player.w - 16,
      h: player.h - 10,
    };

    for (const o of obstacles) {
      if (aabb(hitbox.x, hitbox.y, hitbox.w, hitbox.h, o.x, o.y, o.w, o.h)) {
        if (player.ground === o && player.onGround) continue;
        const aboveTop = (hitbox.y + hitbox.h) <= (o.y + 4);
        if (aboveTop) continue;
        const fromFront = (player.x + player.w * 0.5) <= (o.x + o.w * 0.5);
        if (!fromFront) continue;
        hurt(o);
        break;
      }
    }

    for (const p of pickups) {
      if (p.taken) continue;
      const bx = p.x - p.r;
      const by = p.y - p.r;
      const bw = p.r * 2;
      const bh = p.r * 2;
      if (aabb(hitbox.x, hitbox.y, hitbox.w, hitbox.h, bx, by, bw, bh)) {
        p.taken = true;
        state.corn += p.value || 1;
        state.score += 60 * (p.value || 1);
        Sfx.corn();
        featherBurst(p.x, p.y);
      }
    }

    for (const e of eggs) {
      if (e.smashed) continue;
      const bx = e.x - e.r;
      const by = e.y - e.r;
      const bw = e.r * 2;
      const bh = e.r * 2;
      if (aabb(hitbox.x, hitbox.y, hitbox.w, hitbox.h, bx, by, bw, bh)) {
        e.smashed = true;
        e.smashT = 0;
        state.corn = Math.max(0, state.corn - 1);
        Sfx.egg();
        yolkBurst(e.x, e.y);
      }
    }

    // Shake decays.
    state.shake = Math.max(0, state.shake - dt);

    // UI.
    ui.score.textContent = String(Math.floor(state.score));
    ui.best.textContent = String(Math.floor(state.best));
    ui.corn.textContent = String(state.corn);

    // First placement.
    if (state.t < 0.001) {
      player.x = world.leftBound + Math.floor(W * 0.16);
      player.y = world.floorY - player.h;
    }

    // If player fell (shouldn't), recover.
    if (!wasOnGround && player.y > H + 80) gameOver();
  }

  // --- Render ---
  function render() {
    const W = canvas.width;
    const H = canvas.height;

    const shake = state.shake;
    const sx = shake > 0 ? Math.sin(state.t * 60) * (shake * 12) : 0;
    const sy = shake > 0 ? Math.cos(state.t * 55) * (shake * 8) : 0;

    ctx.save();
    ctx.translate(sx, sy);

    drawRoom(W, H);
    drawPlatforms();
    drawEggs();
    drawPickups();
    drawObstacles();
    drawPlayer();
    drawParticles();
    drawNameTag();
    drawForeground(W, H);

    ctx.restore();

    // Title mode: keep overlay visible.
    if (state.mode === 'title') {
      ui.best.textContent = String(Math.floor(state.best));
      ui.score.textContent = '0';
      ui.corn.textContent = '0';
      setHeartFill(0, 1);
      setHeartFill(1, 1);

      const blink = (Math.sin(state.hintBlink * 3.0) * 0.5 + 0.5);
      ui.cta.innerHTML = startCtaText();
      ui.cta.style.opacity = String(lerp(0.70, 1.0, blink));
      ui.overlay.classList.remove('hidden');

      // Make sure player sits in a nice place for the splash.
      player.x = Math.floor(W * 0.22);
      player.y = Math.floor(H * 0.78) - player.h;
    }
  }

  function drawRoom(W, H) {
    // Sky-ish wall.
    const wallTop = 0;
    const wallBottom = world.floorY;

    const g = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
    const hue = world.roomHue;
    g.addColorStop(0, `hsl(${hue} 44% 22%)`);
    g.addColorStop(1, `hsl(${hue + 18} 48% 14%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, wallBottom);

    // Party bunting.
    {
      const y = Math.floor(H * 0.06);
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 6);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const flags = Math.floor(W / 46);
      for (let i = 0; i < flags; i++) {
        const fx = (i / flags) * W + ((world.scroll * 0.10) % 46);
        const fy = y + 6 + Math.sin(i * 0.8) * 2;
        const c = i % 3 === 0 ? `hsla(${world.popHue} 90% 60% / 0.45)` : (i % 3 === 1 ? `hsla(${world.popHue2} 90% 62% / 0.45)` : 'hsla(42 95% 60% / 0.45)');
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + 18, fy);
        ctx.lineTo(fx + 9, fy + 16);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Wallpaper pattern.
    const p = 38;
    const ox = -((world.scroll * 0.15) % p);
    for (let y = 16; y < wallBottom - 20; y += p) {
      for (let x = ox; x < W + p; x += p) {
        const ix = Math.floor((x + 10000) / p) + Math.floor((y + 10000) / p);
        const col = ix % 3 === 0 ? `hsla(${world.popHue} 92% 66% / 0.16)` : (ix % 3 === 1 ? `hsla(${world.popHue2} 92% 66% / 0.14)` : 'hsla(42 92% 66% / 0.14)');
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x + p * 0.5, y + p * 0.5, 6.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Windows.
    const winW = Math.floor(W * 0.20);
    const winH = Math.floor(H * 0.22);
    const winY = Math.floor(H * 0.10);
    const winX1 = Math.floor(W * 0.08);
    const winX2 = Math.floor(W * 0.70);

    drawWindow(winX1, winY, winW, winH);
    drawWindow(winX2, winY, winW, winH);

    // Wall art frames.
    {
      const frameW = Math.floor(W * 0.16);
      const frameH = Math.floor(H * 0.14);
      const y = Math.floor(H * 0.18);
      const x1 = Math.floor(W * 0.38);
      const x2 = Math.floor(W * 0.56);
      for (const [x, h2] of [[x1, world.popHue], [x2, world.popHue2]]) {
        roundedRect(ctx, x, y, frameW, frameH, 14);
        ctx.fillStyle = 'rgba(18,16,36,0.30)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 3;
        ctx.stroke();

        roundedRect(ctx, x + 10, y + 10, frameW - 20, frameH - 20, 10);
        const gg = ctx.createLinearGradient(x, y, x + frameW, y + frameH);
        gg.addColorStop(0, `hsla(${h2} 92% 60% / 0.42)`);
        gg.addColorStop(1, 'rgba(255,255,255,0.06)');
        ctx.fillStyle = gg;
        ctx.fill();
      }
    }

    // Floor.
    const floorTop = world.floorY;
    const floorG = ctx.createLinearGradient(0, floorTop, 0, H);
    floorG.addColorStop(0, 'hsl(28 42% 22%)');
    floorG.addColorStop(1, 'hsl(24 46% 12%)');
    ctx.fillStyle = floorG;
    ctx.fillRect(0, floorTop, W, H - floorTop);

    // Floorboards.
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    const plank = 52;
    const fx = -((world.scroll * 0.75) % plank);
    for (let x = fx; x < W + plank; x += plank) {
      ctx.beginPath();
      ctx.moveTo(x, floorTop);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Baseboard.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, floorTop - 6, W, 6);

    // Rug (parallax).
    const rugY = floorTop + Math.floor((H - floorTop) * 0.18);
    const rugH = Math.floor((H - floorTop) * 0.60);
    const rugW = Math.floor(W * 0.92);
    const rugX = Math.floor((W - rugW) * 0.5) + Math.floor(Math.sin(world.scroll * 0.001) * 2);
    roundedRect(ctx, rugX, rugY, rugW, rugH, 16);
    ctx.fillStyle = `hsla(${world.popHue} 92% 56% / 0.12)`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${world.popHue2} 92% 60% / 0.18)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rug stripes.
    ctx.save();
    ctx.globalAlpha = 0.25;
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      const yy = rugY + (i / stripes) * rugH;
      const hh = rugH / stripes;
      ctx.fillStyle = i % 2 === 0 ? `hsla(${world.popHue} 92% 58% / 0.60)` : `hsla(${world.popHue2} 92% 60% / 0.55)`;
      ctx.fillRect(rugX + 10, yy, rugW - 20, hh);
    }
    ctx.restore();

    // Simple furniture silhouettes.
    drawSofa(W, H);
    drawLamp(W, H);
  }

  function drawWindow(x, y, w, h) {
    roundedRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(25, 40, 64, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Outside glow.
    ctx.save();
    ctx.globalAlpha = 0.9;
    const g = ctx.createRadialGradient(x + w * 0.3, y + h * 0.35, 10, x + w * 0.5, y + h * 0.5, w);
    g.addColorStop(0, 'rgba(46, 229, 157, 0.25)');
    g.addColorStop(1, 'rgba(46, 229, 157, 0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    // Panes.
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }

  function drawSofa(W, H) {
    const floorTop = world.floorY;
    const x = Math.floor(W * 0.64);
    const y = Math.floor(floorTop - H * 0.06);
    const w = Math.floor(W * 0.30);
    const h = Math.floor(H * 0.10);

    ctx.save();
    ctx.globalAlpha = 0.55;
    roundedRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.restore();
  }

  function drawLamp(W, H) {
    const floorTop = world.floorY;
    const x = Math.floor(W * 0.12);
    const y = Math.floor(floorTop - H * 0.18);
    const baseY = floorTop;

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, baseY);
    ctx.stroke();

    roundedRect(ctx, x - 22, y - 30, 44, 30, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Light cone.
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = 'rgba(255, 214, 102, 0.75)';
    ctx.beginPath();
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x + 18, y);
    ctx.lineTo(x + 80, baseY);
    ctx.lineTo(x - 80, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawObstacles() {
    for (const o of obstacles) {
      const x = o.x;
      const y = o.y;

      // Shadow.
      ctx.globalAlpha = 0.25;
      roundedRect(ctx, x + 6, world.floorY - 10, o.w - 6, 12, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();
      ctx.globalAlpha = 1;

      // Body.
      roundedRect(ctx, x, y, o.w, o.h, 10);
      const g = ctx.createLinearGradient(x, y, x, y + o.h);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = o.color;
      ctx.fill();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Face details for fun.
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(x + o.w * 0.35, y + o.h * 0.45, 3.2, 0, Math.PI * 2);
      ctx.arc(x + o.w * 0.65, y + o.h * 0.45, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      const x = p.x;
      const y = p.y;

      const isStep = p.kind === 'step';

      // Undershadow.
      ctx.globalAlpha = 0.18;
      roundedRect(ctx, x + 6, y + p.h + 6, p.w - 12, 10, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isStep) {
        // Draw steps as solid blocks down to the floor so they read as a single staircase.
        const bottom = world.floorY;
        roundedRect(ctx, x, y, p.w, Math.max(p.h, bottom - y), 10);
        const gg = ctx.createLinearGradient(x, y, x, bottom);
        gg.addColorStop(0, 'rgba(46, 229, 157, 0.34)');
        gg.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
        ctx.fillStyle = gg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tread highlight.
        roundedRect(ctx, x, y, p.w, p.h, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fill();

        // Riser line.
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + p.h);
        ctx.lineTo(x + p.w - 10, y + p.h);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }

      // Shelf.
      roundedRect(ctx, x, y, p.w, p.h, 10);
      const g = ctx.createLinearGradient(x, y, x, y + p.h);
      g.addColorStop(0, 'rgba(255,255,255,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = `hsla(${world.popHue2} 92% 60% / 0.22)`;
      ctx.fill();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Little pegs.
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let i = 0; i < 4; i++) {
        const px = x + (p.w * (0.15 + i * 0.22));
        ctx.beginPath();
        ctx.arc(px, y + p.h + 2, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const p of pickups) {
      if (p.taken) continue;
      const bob = Math.sin(p.t * 7.0) * 6;
      const x = p.x;
      const y = p.y + bob;

      // Glow.
      ctx.save();
      ctx.globalAlpha = p.kind === 'big' ? 0.65 : 0.45;
      const g = ctx.createRadialGradient(x, y, 2, x, y, p.r * 2.4);
      g.addColorStop(0, p.kind === 'big' ? 'rgba(255, 214, 102, 0.75)' : 'rgba(255, 214, 102, 0.55)');
      g.addColorStop(1, 'rgba(255, 214, 102, 0.00)');
      ctx.fillStyle = g;
      ctx.fillRect(x - p.r * 2.4, y - p.r * 2.4, p.r * 4.8, p.r * 4.8);
      ctx.restore();

      // Corn kernel.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(p.t * 5) * (p.kind === 'big' ? 0.18 : 0.25));
      roundedRect(ctx, -p.r * 0.9, -p.r * 0.7, p.r * 1.8, p.r * 1.4, p.r * 0.6);
      ctx.fillStyle = p.kind === 'big' ? '#ffdf7a' : '#ffd166';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tiny highlight dots.
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff7ea';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-p.r * 0.35 + i * (p.r * 0.18), -p.r * 0.15 + (i % 2) * 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Big corn sparkle.
      if (p.kind === 'big') {
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 1.25);
        ctx.lineTo(0, -p.r * 0.75);
        ctx.moveTo(-p.r * 0.25, -p.r);
        ctx.lineTo(p.r * 0.25, -p.r);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawEggs() {
    for (const e of eggs) {
      const x = e.x;
      const y = e.y;

      // Shadow.
      ctx.save();
      ctx.globalAlpha = 0.18;
      roundedRect(ctx, x - e.r, world.floorY - 10, e.r * 2, 10, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fill();
      ctx.restore();

      if (e.smashed) {
        const t = clamp(e.smashT / 0.60, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.60 * (1 - t);
        ctx.fillStyle = 'rgba(255, 214, 102, 0.75)';
        ctx.beginPath();
        ctx.ellipse(x, world.floorY - 8, e.r * 1.6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // Egg body.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(e.t * 3.2) * 0.06);

      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r * 0.92, e.r * 1.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Highlight.
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff7ea';
      ctx.beginPath();
      ctx.ellipse(-e.r * 0.28, -e.r * 0.25, e.r * 0.22, e.r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawNameTag() {
    const name = state.name;
    if (!name) return;

    const x = player.x + player.w * 0.5;
    const y = player.y - 10;

    ctx.save();
    ctx.font = '18px \"Chalkboard SE\", \"Comic Sans MS\", \"Marker Felt\", ui-rounded, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const padX = 10;
    const padY = 6;
    const m = ctx.measureText(name);
    const w = Math.max(46, Math.ceil(m.width + padX * 2));
    const h = 26;

    roundedRect(ctx, x - w / 2, y - h, w, h, 10);
    ctx.fillStyle = 'rgba(18, 16, 36, 0.52)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text.
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeText(name, x, y - padY);
    ctx.fillStyle = '#fff7ea';
    ctx.fillText(name, x, y - padY);

    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;

    // Blink when invulnerable.
    if (player.invuln > 0 && (Math.floor(state.t * 16) % 2) === 0) ctx.globalAlpha = 0.55;

    // Shadow.
    const shW = player.w * 0.9;
    const shH = 12;
    const shX = x + (player.w - shW) * 0.5;
    const shY = world.floorY - 9;
    const air = clamp((world.floorY - (y + player.h)) / 120, 0, 1);

    ctx.save();
    ctx.globalAlpha = lerp(0.28, 0.10, air);
    roundedRect(ctx, shX, shY, shW, shH, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fill();
    ctx.restore();

    // Chicken pose.
    const run = player.onGround ? Math.sin(player.anim * 10) : 0;
    const bounce = player.onGround ? Math.abs(run) * 2.0 : -2.0;
    const tilt = player.onGround ? run * 0.04 : clamp(player.vy / 1200, -0.22, 0.18);

    ctx.save();
    ctx.translate(x + player.w * 0.5, y + player.h * 0.6 + bounce);
    ctx.rotate(tilt);

    const palettes = {
      butter: { body: '#fff7ea', wing: '#fde6c5', comb: '#ff4b3a', beak: '#ffd166', ink: 'rgba(0,0,0,0.18)' },
      red: { body: '#ff6a5b', wing: '#ffd2cd', comb: '#c81d25', beak: '#ffd166', ink: 'rgba(0,0,0,0.20)' },
      blue: { body: '#4cc9f0', wing: '#d7f4ff', comb: '#ff4b3a', beak: '#ffd166', ink: 'rgba(0,0,0,0.20)' },
      green: { body: '#2ee59d', wing: '#d9fff0', comb: '#ff4b3a', beak: '#ffd166', ink: 'rgba(0,0,0,0.20)' },
      grape: { body: '#9b5de5', wing: '#eadbff', comb: '#ff4b3a', beak: '#ffd166', ink: 'rgba(0,0,0,0.22)' },
      charcoal: { body: '#34324a', wing: '#a9a7b8', comb: '#ff4b3a', beak: '#ffd166', ink: 'rgba(0,0,0,0.22)' },
    };
    const pal = palettes[state.color] || palettes.butter;

    // Body.
    ctx.fillStyle = pal.body;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly shading.
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ff6a3d';
    ctx.beginPath();
    ctx.ellipse(2, 4, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Design overlays.
    if (state.design === 'spots') {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(-10 + (i * 4), -2 + ((i % 2) * 6), 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (state.design === 'flame') {
      // Flame gradient wash.
      ctx.save();
      ctx.globalAlpha = 0.40;
      const g = ctx.createLinearGradient(-26, -18, 26, 18);
      g.addColorStop(0, 'rgba(255, 214, 102, 0.55)');
      g.addColorStop(0.6, 'rgba(255, 106, 61, 0.55)');
      g.addColorStop(1, 'rgba(255, 59, 48, 0.50)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Little flame licks behind.
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(255, 106, 61, 0.65)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-22 - i * 4, -6 + i * 4);
        ctx.quadraticCurveTo(-34 - i * 6, -14 + i * 4, -26 - i * 4, 2 + i * 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (state.design === 'robot') {
      // Metallic panel.
      ctx.save();
      const g = ctx.createLinearGradient(-22, -16, 22, 16);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.45, 'rgba(180,180,200,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0.14)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Wing.
    const wingFlap = player.onGround ? run * 0.18 : Math.sin(state.t * 16) * 0.28;
    ctx.save();
    ctx.translate(-6, 2);
    ctx.rotate(wingFlap);
    ctx.fillStyle = pal.wing;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Head.
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.ellipse(18, -12, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Comb.
    ctx.fillStyle = pal.comb;
    ctx.beginPath();
    ctx.moveTo(15, -26);
    ctx.quadraticCurveTo(18, -34, 22, -26);
    ctx.quadraticCurveTo(25, -34, 28, -26);
    ctx.quadraticCurveTo(30, -18, 22, -18);
    ctx.closePath();
    ctx.fill();

    // Beak.
    ctx.fillStyle = pal.beak;
    ctx.beginPath();
    ctx.moveTo(30, -10);
    ctx.lineTo(40, -7);
    ctx.lineTo(30, -4);
    ctx.closePath();
    ctx.fill();

    // Eye.
    ctx.fillStyle = state.design === 'robot' ? 'rgba(76, 201, 240, 0.85)' : 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(22, -12, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Legs.
    const legKick = player.onGround ? run * 7 : 0;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.lineTo(-8, 20 + legKick * 0.06);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.lineTo(9, 20 - legKick * 0.06);
    ctx.stroke();

    // Tiny speed lines when moving.
    if (Math.abs(player.vx) > 220 && player.onGround) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-30 - i * 8, -4 + i * 6);
        ctx.lineTo(-44 - i * 8, -2 + i * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const prt of particles) {
      const t = prt.t / prt.life;
      const a = 1 - t;
      if (prt.kind === 'dust') {
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(prt.x, prt.y, lerp(6, 14, t), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      if (prt.kind === 'yolk') {
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = 'rgba(255, 214, 102, 0.85)';
        ctx.beginPath();
        ctx.arc(prt.x, prt.y, lerp(2.5, 6.5, t), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      // Feather.
      ctx.save();
      ctx.translate(prt.x, prt.y);
      if (prt.rot != null) ctx.rotate(prt.rot);
      ctx.globalAlpha = a * 0.7;
      roundedRect(ctx, -6, -2, 12, 4, 2);
      ctx.fillStyle = '#fff7ea';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function drawForeground(W, H) {
    // Vignette.
    ctx.save();
    const g = ctx.createRadialGradient(W * 0.5, H * 0.55, Math.min(W, H) * 0.2, W * 0.5, H * 0.55, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Floor sparkle line.
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, world.floorY + 14);
    ctx.lineTo(W, world.floorY + 14);
    ctx.stroke();
    ctx.restore();
  }

  // --- Main loop ---
  let last = nowMs();

  function frame() {
    const t = nowMs();
    const dtReal = clamp((t - last) / 1000, 0, 1 / 20);
    last = t;

    const dt = state.mode === 'playing' ? clamp(dtReal * state.timeScale, 0, 1 / 15) : dtReal;
    update(dt);
    render();

    requestAnimationFrame(frame);
  }

  // Initial placement.
  player.x = 220;
  player.y = 340;

  // Keep title overlay.
  showOverlay('Chicken Hop', startCtaText());
  ui.best.textContent = String(Math.floor(state.best));
  setTimeMode(state.timeMode);

  requestAnimationFrame(frame);
})();
