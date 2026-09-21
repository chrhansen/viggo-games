import * as THREE from "three";
import { createPlayerControls } from "./player-controls.js";
import { createWeaponSoundEffects } from "./weapon-sfx.js";
import { createHunterScene } from "./scene.js";
import { LOOK_RANGE, terrainHeight, PLAYER_HEIGHT } from "./core/world.js";
import { configureNatureTextures } from "./nature-materials.js";
import groundUrl from "./assets/ground.png";
import barkUrl from "./assets/bark.png";
import furUrl from "./assets/fur.png";
import needlesUrl from "./assets/needles.png";
import leavesUrl from "./assets/leaves.png";
import skyUrl from "./assets/sky.png";

async function startGame() {
  const textureUrls = { ground: groundUrl, bark: barkUrl, fur: furUrl, needles: needlesUrl, leaves: leavesUrl, sky: skyUrl };
  const loader = new THREE.TextureLoader();
  const textures = Object.fromEntries(await Promise.all(Object.entries(textureUrls).map(async ([kind, url]) => [kind, await loader.loadAsync(url)])));
  configureNatureTextures((kind) => textures[kind].clone());
  const root = document.getElementById("game-root");
  const overlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");
  const statusText = document.getElementById("status-text");
  const scoreText = document.getElementById("score");
  const controlsCard = document.getElementById("controls-card");
  const controlsCloseBtn = document.getElementById("controls-close");
  const controlsText = document.getElementById("controls-text");
  const beltButtons = Array.from(document.querySelectorAll(".belt-item"));
  const touchDpad = document.getElementById("touch-dpad");
  const dpadThumb = document.getElementById("dpad-thumb");
  const fireBtn = document.getElementById("fire-btn");
  const CONTROLS_CARD_TIMEOUT_MS = 10000;


  const game = createHunterScene({ aspect: window.innerWidth / window.innerHeight });
  const { camera } = game;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  root.appendChild(renderer.domElement);
  const weaponSoundEffects = createWeaponSoundEffects();
  let controlsCardTimer = null;
  let controlsCardDismissed = false;
  const setMessage = (text, seconds) => game.engine.setMessage(text, seconds);
  function hideControlsCard() {
    controlsCard.classList.add("hidden");
  }

  function showControlsCard() {
    if (controlsCardDismissed) {
      return;
    }
    controlsCard.classList.remove("hidden");
  }

  function startControlsCardTimer() {
    if (controlsCardDismissed) {
      return;
    }
    showControlsCard();
    window.clearTimeout(controlsCardTimer);
    controlsCardTimer = window.setTimeout(() => {
      hideControlsCard();
    }, CONTROLS_CARD_TIMEOUT_MS);
  }

  controlsCloseBtn.addEventListener("click", () => {
    controlsCardDismissed = true;
    window.clearTimeout(controlsCardTimer);
    hideControlsCard();
  });

  function setWeapon(weaponName) {
    game.engine.setWeapon(weaponName);
    const selectedWeapon = game.engine.state.selectedWeapon;
    beltButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.weapon === selectedWeapon);
    });
    game.sync();
  }

  beltButtons.forEach((button) => {
    button.addEventListener("click", () => setWeapon(button.dataset.weapon));
  });

  document.addEventListener("keydown", (event) => {
    switch (event.code) {
      case "Digit1":
        setWeapon("rifle");
        break;
      case "Digit2":
        setWeapon("bow");
        break;
      case "Digit3":
        setWeapon("knife");
        break;
      case "Digit4":
        setWeapon("squirt");
        break;
      default:
        break;
    }
  });


  const controls = createPlayerControls({
    camera, renderer, overlay, startBtn, statusText, controlsText, touchDpad, dpadThumb, fireBtn,
    lookRangeRadians: LOOK_RANGE, terrainHeight, playerHeight: PLAYER_HEIGHT,
    setMessage, warmupAudio: () => weaponSoundEffects.warmup(),
    onUseWeapon: () => {
      weaponSoundEffects.warmup();
      if (game.fire()) weaponSoundEffects.play(game.engine.state.selectedWeapon);
    },
    onSessionActiveChange: (active) => {
      game.engine.setActive(active);
      if (active) startControlsCardTimer();
      else { window.clearTimeout(controlsCardTimer); showControlsCard(); }
    },
  });
  const clock = new THREE.Clock();
  controls.showStartPrompt();
  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    const input = controls.update(delta);
    game.engine.look(camera.rotation.y, camera.rotation.x);
    game.step(delta, input);
    scoreText.textContent = `Animals tagged: ${game.engine.state.score}`;
    if (controls.isActive) statusText.textContent = game.engine.state.message;
    renderer.render(game.scene, camera);
  }
  animate();
  window.addEventListener("resize", () => {
    game.resize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

}
startGame().catch((error) => {
  console.error("Hunter Guy could not start", error);
  document.getElementById("status-text").textContent = "The forest could not load. Please reload to try again.";
});
