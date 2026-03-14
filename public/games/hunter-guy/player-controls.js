import * as THREE from "three";

const DESKTOP_LOOK_SENSITIVITY = 0.0024;
const TOUCH_LOOK_SENSITIVITY = 0.0042;
const TOUCH_DPAD_DEAD_ZONE = 0.3;
const TOUCH_DPAD_THUMB_TRAVEL = 34;

export function createPlayerControls({
  camera,
  renderer,
  overlay,
  startBtn,
  statusText,
  controlsText,
  touchDpad,
  dpadThumb,
  fireBtn,
  lookRangeRadians,
  terrainHeight,
  clampToWorld,
  playerHeight,
  setMessage,
  warmupAudio,
  onUseWeapon,
  onSessionActiveChange,
}) {
  const touchUiEnabled =
    window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const startPrompt = touchUiEnabled ? "Tap Start Hunt" : "Click to enter forest";
  const playerViewEuler = new THREE.Euler(0, 0, 0, "YXZ");
  const move = {
    forward: false,
    backward: false,
    turnLeft: false,
    turnRight: false,
  };
  const touchMove = {
    pointerId: null,
    x: 0,
    y: 0,
  };
  const touchLook = {
    pointerId: null,
    x: 0,
    y: 0,
  };
  const deviceLook = {
    attached: false,
    baseline: null,
    yaw: 0,
    pitch: 0,
    permissionTried: false,
  };

  let sessionActive = false;
  let manualYaw = 0;
  let manualPitch = 0;

  document.body.classList.toggle("touch-mode", touchUiEnabled);
  controlsText.innerHTML = touchUiEnabled
    ? "<strong>Controls:</strong> Left thumb D-pad = move, drag the view to look, turn phone or iPad for extra look, tap Use Tool to tag, tap belt buttons to switch gear."
    : "<strong>Controls:</strong> Click to lock cursor, mouse look is limited up/down, W/Up = forward, S/Down = backward, A-D or Left-Right = turn, 1-4 to switch gear, left click to use tool.";
  statusText.textContent = startPrompt;

  function clampPitch(value) {
    return THREE.MathUtils.clamp(value, -lookRangeRadians, lookRangeRadians);
  }

  function normalizeDeltaDegrees(value) {
    return THREE.MathUtils.euclideanModulo(value + 180, 360) - 180;
  }

  function getScreenAngle() {
    return window.screen?.orientation?.angle ?? window.orientation ?? 0;
  }

  function showStartPrompt() {
    setMessage(startPrompt, 99);
  }

  function applyCameraRotation() {
    playerViewEuler.set(
      clampPitch(manualPitch + deviceLook.pitch),
      manualYaw + deviceLook.yaw,
      0
    );
    camera.quaternion.setFromEuler(playerViewEuler);
  }

  function applyLookDelta(deltaYaw, deltaPitch) {
    manualYaw += deltaYaw;
    manualPitch = clampPitch(manualPitch + deltaPitch);
    applyCameraRotation();
  }

  function setTouchMoveVector(x, y) {
    touchMove.x = x;
    touchMove.y = y;
    dpadThumb.style.transform = `translate(calc(-50% + ${x * TOUCH_DPAD_THUMB_TRAVEL}px), calc(-50% + ${-y * TOUCH_DPAD_THUMB_TRAVEL}px))`;
    touchDpad.classList.toggle("active", x !== 0 || y !== 0);
  }

  function clearTouchLook() {
    touchLook.pointerId = null;
  }

  function releaseTouchMove() {
    touchMove.pointerId = null;
    setTouchMoveVector(0, 0);
  }

  function clearMovementState() {
    move.forward = false;
    move.backward = false;
    move.turnLeft = false;
    move.turnRight = false;
    releaseTouchMove();
    clearTouchLook();
  }

  function setSessionActive(active) {
    sessionActive = active;
    document.body.classList.toggle("session-active", active);
    overlay.classList.toggle("hidden", active);
    onSessionActiveChange?.(active);
    if (!active) {
      clearMovementState();
    }
  }

  function resetDeviceLook() {
    deviceLook.baseline = null;
    deviceLook.yaw = 0;
    deviceLook.pitch = 0;
    applyCameraRotation();
  }

  function updateTouchMoveFromEvent(event) {
    const rect = touchDpad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = THREE.MathUtils.clamp(
      (event.clientX - centerX) / (rect.width / 2),
      -1,
      1
    );
    const rawY = THREE.MathUtils.clamp(
      (centerY - event.clientY) / (rect.height / 2),
      -1,
      1
    );
    const snappedX = Math.abs(rawX) > TOUCH_DPAD_DEAD_ZONE ? Math.sign(rawX) : 0;
    const snappedY = Math.abs(rawY) > TOUCH_DPAD_DEAD_ZONE ? Math.sign(rawY) : 0;

    if (snappedX === 0 && snappedY === 0) {
      setTouchMoveVector(0, 0);
      return;
    }

    const length = Math.hypot(snappedX, snappedY);
    setTouchMoveVector(snappedX / length, snappedY / length);
  }

  function handleDeviceOrientation(event) {
    if (!sessionActive) {
      return;
    }

    const { alpha, beta, gamma } = event;
    if (typeof alpha !== "number" || typeof beta !== "number" || typeof gamma !== "number") {
      return;
    }

    const screenAngle = getScreenAngle();
    const pitchSample = Math.abs(screenAngle) === 90 ? gamma : beta;
    if (!deviceLook.baseline || deviceLook.baseline.screenAngle !== screenAngle) {
      deviceLook.baseline = {
        alpha,
        pitchSample,
        screenAngle,
      };
      deviceLook.yaw = 0;
      deviceLook.pitch = 0;
      applyCameraRotation();
      return;
    }

    const targetYaw = THREE.MathUtils.degToRad(
      normalizeDeltaDegrees(alpha - deviceLook.baseline.alpha)
    );
    const targetPitch = clampPitch(
      THREE.MathUtils.degToRad(pitchSample - deviceLook.baseline.pitchSample)
    );

    deviceLook.yaw = THREE.MathUtils.lerp(deviceLook.yaw, targetYaw, 0.28);
    deviceLook.pitch = THREE.MathUtils.lerp(deviceLook.pitch, targetPitch, 0.32);
    applyCameraRotation();
  }

  async function enableDeviceLook() {
    if (!touchUiEnabled || deviceLook.attached || deviceLook.permissionTried) {
      return;
    }

    if (typeof window.DeviceOrientationEvent === "undefined") {
      return;
    }

    deviceLook.permissionTried = true;

    try {
      if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setMessage("Touch look active. Motion access blocked.", 1.4);
          return;
        }
      }

      window.addEventListener("deviceorientation", handleDeviceOrientation);
      deviceLook.attached = true;
      resetDeviceLook();
    } catch {
      setMessage("Touch look active. Motion sensor unavailable.", 1.4);
    }
  }

  function startTouchSession() {
    if (sessionActive) {
      return;
    }

    warmupAudio();
    setSessionActive(true);
    resetDeviceLook();
    setMessage("Touch hunt active. Drag or turn device to aim.", 2);
    void enableDeviceLook();
  }

  function lockControls() {
    warmupAudio();
    if (touchUiEnabled) {
      startTouchSession();
      return;
    }
    renderer.domElement.requestPointerLock();
  }

  renderer.domElement.addEventListener("mousedown", (event) => {
    if (touchUiEnabled || event.button !== 0) {
      return;
    }
    onUseWeapon();
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== renderer.domElement) {
      return;
    }
    applyLookDelta(
      -event.movementX * DESKTOP_LOOK_SENSITIVITY,
      event.movementY * DESKTOP_LOOK_SENSITIVITY
    );
  });

  document.addEventListener("keydown", (event) => {
    if (event.code.startsWith("Arrow")) {
      event.preventDefault();
    }
    const letter = event.key.length === 1 ? event.key.toLowerCase() : "";
    switch (event.code) {
      case "ArrowUp":
        move.forward = true;
        break;
      case "ArrowDown":
        move.backward = true;
        break;
      case "ArrowLeft":
        move.turnLeft = true;
        break;
      case "ArrowRight":
        move.turnRight = true;
        break;
      default:
        break;
    }

    if (letter === "w") {
      move.forward = true;
    } else if (letter === "s") {
      move.backward = true;
    } else if (letter === "a") {
      move.turnLeft = true;
    } else if (letter === "d") {
      move.turnRight = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code.startsWith("Arrow")) {
      event.preventDefault();
    }
    const letter = event.key.length === 1 ? event.key.toLowerCase() : "";
    switch (event.code) {
      case "ArrowUp":
        move.forward = false;
        break;
      case "ArrowDown":
        move.backward = false;
        break;
      case "ArrowLeft":
        move.turnLeft = false;
        break;
      case "ArrowRight":
        move.turnRight = false;
        break;
      default:
        break;
    }

    if (letter === "w") {
      move.forward = false;
    } else if (letter === "s") {
      move.backward = false;
    } else if (letter === "a") {
      move.turnLeft = false;
    } else if (letter === "d") {
      move.turnRight = false;
    }
  });

  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === renderer.domElement;
    if (locked) {
      setSessionActive(true);
      setMessage("Woods active. Track foxes, deer, and bears.", 2);
      return;
    }

    if (!touchUiEnabled) {
      setSessionActive(false);
      showStartPrompt();
    }
  });

  touchDpad.addEventListener("pointerdown", (event) => {
    if (!touchUiEnabled || event.pointerType !== "touch") {
      return;
    }

    event.preventDefault();
    if (!sessionActive) {
      startTouchSession();
    }
    touchMove.pointerId = event.pointerId;
    touchDpad.setPointerCapture(event.pointerId);
    updateTouchMoveFromEvent(event);
  });

  touchDpad.addEventListener("pointermove", (event) => {
    if (touchMove.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateTouchMoveFromEvent(event);
  });

  function endTouchPadPointer(event) {
    if (touchMove.pointerId !== event.pointerId) {
      return;
    }

    if (touchDpad.hasPointerCapture(event.pointerId)) {
      touchDpad.releasePointerCapture(event.pointerId);
    }
    releaseTouchMove();
  }

  touchDpad.addEventListener("pointerup", endTouchPadPointer);
  touchDpad.addEventListener("pointercancel", endTouchPadPointer);

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (!touchUiEnabled || event.pointerType !== "touch" || !sessionActive) {
      return;
    }

    event.preventDefault();
    touchLook.pointerId = event.pointerId;
    touchLook.x = event.clientX;
    touchLook.y = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    if (touchLook.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - touchLook.x;
    const deltaY = event.clientY - touchLook.y;
    touchLook.x = event.clientX;
    touchLook.y = event.clientY;
    applyLookDelta(-deltaX * TOUCH_LOOK_SENSITIVITY, deltaY * TOUCH_LOOK_SENSITIVITY);
  });

  function endTouchLookPointer(event) {
    if (touchLook.pointerId !== event.pointerId) {
      return;
    }

    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }
    clearTouchLook();
  }

  renderer.domElement.addEventListener("pointerup", endTouchLookPointer);
  renderer.domElement.addEventListener("pointercancel", endTouchLookPointer);

  fireBtn.addEventListener("pointerdown", (event) => {
    if (!touchUiEnabled || event.pointerType !== "touch") {
      return;
    }

    event.preventDefault();
    if (!sessionActive) {
      startTouchSession();
    }
    onUseWeapon();
  });

  startBtn.addEventListener("click", lockControls);
  renderer.domElement.addEventListener("click", () => {
    if (!touchUiEnabled) {
      lockControls();
    }
  });

  window.addEventListener("blur", clearMovementState);
  window.addEventListener("orientationchange", resetDeviceLook);
  window.screen?.orientation?.addEventListener?.("change", resetDeviceLook);

  function update(delta) {
    if (!sessionActive) {
      return;
    }

    const speed = 10;
    const turnSpeed = 0.95;

    if (move.turnLeft) {
      manualYaw += turnSpeed * delta;
    }
    if (move.turnRight) {
      manualYaw -= turnSpeed * delta;
    }
    applyCameraRotation();

    const forwardInput =
      (move.forward ? 1 : 0) - (move.backward ? 1 : 0) + touchMove.y;
    const strafeInput = touchMove.x;
    const inputLength = Math.hypot(strafeInput, forwardInput);

    if (inputLength > 0) {
      const moveYaw = manualYaw + deviceLook.yaw;
      const distance = speed * delta;
      const forward = forwardInput / Math.max(1, inputLength);
      const strafe = strafeInput / Math.max(1, inputLength);
      camera.position.x +=
        (-Math.sin(moveYaw) * forward + Math.cos(moveYaw) * strafe) * distance;
      camera.position.z +=
        (-Math.cos(moveYaw) * forward - Math.sin(moveYaw) * strafe) * distance;
    }

    clampToWorld(camera);
    camera.position.y = terrainHeight(camera.position.x, camera.position.z) + playerHeight;
  }

  applyCameraRotation();

  return {
    touchUiEnabled,
    update,
    showStartPrompt,
    get isActive() {
      return sessionActive;
    },
  };
}
