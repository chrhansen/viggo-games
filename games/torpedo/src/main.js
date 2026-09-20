import './styles.css';
import { OceanCombat } from './game/OceanCombat.js';
import { InteriorWalk } from './game/InteriorWalk.js';

const canvas = document.querySelector('#combat-canvas');
const combatUi = document.querySelector('#combat-ui');
const interiorScreen = document.querySelector('#interior-screen');
const startButton = document.querySelector('#start-button');
const splashScreen = document.querySelector('#splash-screen');
const fireButton = document.querySelector('#fire-button');
const roomsButton = document.querySelector('#rooms-button');
const periscopeButton = document.querySelector('#periscope-button');
const motionToggle = document.querySelector('#motion-toggle');
const moveButtons = [...document.querySelectorAll('[data-move-x][data-move-y]')];
const roomControls = {
  previous: document.querySelector('#room-prev'),
  next: document.querySelector('#room-next'),
  enter: document.querySelector('#room-enter'),
  back: document.querySelector('#room-back')
};

const hud = {
  viewTitle: document.querySelector('#view-title'),
  score: document.querySelector('#score-meter'),
  level: document.querySelector('#level-meter'),
  health: document.querySelector('#health-meter'),
  charge: document.querySelector('#charge-meter'),
  windowFrame: document.querySelector('#window-frame'),
  periscopeMask: document.querySelector('#periscope-mask'),
  damageFlash: document.querySelector('#damage-flash')
};

const roomHud = {
  title: document.querySelector('#room-title'),
  meter: document.querySelector('#room-meter')
};

let currentMode = 'combat';
let motionEnabled = false;
let motionSignalSeen = false;
let motionSignalTimer = 0;

const combat = new OceanCombat(canvas, hud, {
  onEnterInterior: () => switchToInterior(),
  onGameOver: () => {
    splashScreen.classList.remove('hidden');
    splashScreen.querySelector('h2').textContent = 'Hull Breached';
    splashScreen.querySelector('p').textContent = 'Start a new patrol and try a sneakier dodge.';
    startButton.textContent = 'Restart Patrol';
  }
});
window.__torpedoDebugMotion = () => ({ ...combat.input.motion });

const interior = new InteriorWalk(interiorScreen, roomHud, {
  onExit: (view) => switchToCombat(view),
  onAction: (action) => combat.performInteriorAction(action)
});

function switchToInterior() {
  currentMode = 'interior';
  combat.pause();
  combatUi.classList.add('hidden');
  interiorScreen.classList.remove('hidden');
  interior.focus();
}

function switchToCombat(view = 'front') {
  currentMode = 'combat';
  interiorScreen.classList.add('hidden');
  combatUi.classList.remove('hidden');
  combat.setView(view);
  combat.resume();
}

startButton.addEventListener('click', () => {
  splashScreen.classList.add('hidden');
  if (combat.isGameOver) {
    combat.restart();
  }
  combat.start();
});

window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }

  if (!splashScreen.classList.contains('hidden')) {
    if (event.code === 'Enter' || event.code === 'Space') {
      startButton.click();
    }
    return;
  }

  if (currentMode === 'combat') {
    combat.handleKeyDown(event);
  } else {
    interior.handleKeyDown(event);
  }
});

window.addEventListener('keyup', (event) => {
  if (currentMode === 'combat') {
    combat.handleKeyUp(event);
  }
});

window.addEventListener('blur', () => combat.clearKeys());
window.addEventListener('resize', () => combat.resize());
window.addEventListener('deviceorientation', (event) => {
  const usedMotion = combat.handleDeviceOrientation(event);
  if (usedMotion && motionEnabled) {
    motionSignalSeen = true;
    setMotionButton('Tilt On', true);
  }
});

for (const button of moveButtons) {
  bindHoldButton(button, () => {
    combat.setTouchInput(Number(button.dataset.moveX), Number(button.dataset.moveY));
  }, () => combat.clearTouchInput());
}

fireButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  combat.firePlayerTorpedo();
});

roomsButton.addEventListener('click', () => {
  if (!splashScreen.classList.contains('hidden')) return;
  switchToInterior();
});

periscopeButton.addEventListener('click', () => {
  if (!splashScreen.classList.contains('hidden')) return;
  const view = combat.togglePeriscope();
  periscopeButton.setAttribute('aria-pressed', view === 'periscope' ? 'true' : 'false');
});

motionToggle.addEventListener('click', () => toggleMotionControl());
roomControls.previous.addEventListener('click', () => interior.moveRoom(-1));
roomControls.next.addEventListener('click', () => interior.moveRoom(1));
roomControls.enter.addEventListener('click', () => interior.confirm());
roomControls.back.addEventListener('click', () => interior.back());

function bindHoldButton(button, onStart, onEnd) {
  const stop = () => {
    button.classList.remove('pressed');
    onEnd();
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    button.classList.add('pressed');
    onStart();
  });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
}

async function toggleMotionControl() {
  if (motionEnabled) {
    disableMotionControl();
    return;
  }

  if (!window.isSecureContext) {
    setMotionButton('Needs HTTPS', false, true);
    return;
  }

  if (!('DeviceOrientationEvent' in window)) {
    setMotionButton('Unavailable', false, true);
    return;
  }

  try {
    const orientation = window.DeviceOrientationEvent;
    if (typeof orientation.requestPermission === 'function') {
      const permission = await orientation.requestPermission();
      if (permission !== 'granted') {
        setMotionButton('Denied', false, true);
        return;
      }
    }

    motionEnabled = true;
    motionSignalSeen = false;
    combat.setMotionControl(true);
    setMotionButton('Move Phone', true);
    clearTimeout(motionSignalTimer);
    motionSignalTimer = window.setTimeout(() => {
      if (motionEnabled && !motionSignalSeen) {
        setMotionButton('No Signal', true, true);
      }
    }, 1800);
  } catch {
    setMotionButton('Motion', false, true);
  }
}

function disableMotionControl() {
  motionEnabled = false;
  motionSignalSeen = false;
  clearTimeout(motionSignalTimer);
  combat.setMotionControl(false);
  setMotionButton('Motion', false);
}

function setMotionButton(label, pressed, warning = false) {
  motionToggle.textContent = label;
  motionToggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  motionToggle.classList.toggle('warning', warning);
}

combat.resize();
combat.renderStill();
