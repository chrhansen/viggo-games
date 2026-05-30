import './styles.css';
import { OceanCombat } from './game/OceanCombat.js';
import { InteriorWalk } from './game/InteriorWalk.js';

const canvas = document.querySelector('#combat-canvas');
const combatUi = document.querySelector('#combat-ui');
const interiorScreen = document.querySelector('#interior-screen');
const startButton = document.querySelector('#start-button');
const splashScreen = document.querySelector('#splash-screen');

const hud = {
  viewTitle: document.querySelector('#view-title'),
  score: document.querySelector('#score-meter'),
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

const combat = new OceanCombat(canvas, hud, {
  onEnterInterior: () => switchToInterior(),
  onGameOver: () => {
    splashScreen.classList.remove('hidden');
    splashScreen.querySelector('h2').textContent = 'Hull Breached';
    splashScreen.querySelector('p').textContent = 'Start a new patrol and try a sneakier dodge.';
    startButton.textContent = 'Restart Patrol';
  }
});

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

combat.resize();
combat.renderStill();
