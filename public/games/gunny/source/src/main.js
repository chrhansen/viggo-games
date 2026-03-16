import "./style.css";
import { GunnyGame } from "./game.js";

new GunnyGame({
  canvas: document.querySelector("#game"),
  missionCard: document.querySelector("#missionCard"),
  introPanel: document.querySelector("#introPanel"),
  statusPanel: document.querySelector("#statusPanel"),
  dismissTitleCard: document.querySelector("#dismissTitleCard"),
  launchButton: document.querySelector("#launchButton"),
  restartButton: document.querySelector("#restartButton"),
  statusEyebrow: document.querySelector("#statusEyebrow"),
  statusTitle: document.querySelector("#statusTitle"),
  statusMessage: document.querySelector("#statusMessage"),
  healthValue: document.querySelector("#healthValue"),
  scoreValue: document.querySelector("#scoreValue"),
  killsValue: document.querySelector("#killsValue"),
  distanceValue: document.querySelector("#distanceValue"),
  touchControls: document.querySelector("#touchControls"),
});
