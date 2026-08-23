import type {
  ChickenHopInput,
  ChickenHopMode,
  ChickenHopTimeMode,
} from "@viggo-games/chicken-hop-core";

type TouchAction = keyof ChickenHopInput;

interface ChickenHopInputCallbacks {
  ensureAudio: () => void;
  getMode: () => ChickenHopMode;
  onPause: () => void;
  onRestart: () => void;
  onStart: () => void;
  onTimeMode: (mode: ChickenHopTimeMode) => void;
}

export class ChickenHopWebInput {
  private keys = new Set<string>();
  private touchButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-touch]"),
  );
  private touchCounts: Record<TouchAction, number> = {
    down: 0,
    jump: 0,
    left: 0,
    right: 0,
  };
  private touchPointers = new Map<number, TouchAction>();
  private touchState: ChickenHopInput = {
    down: false,
    jump: false,
    left: false,
    right: false,
  };

  constructor(
    private touchMode: boolean,
    private callbacks: ChickenHopInputCallbacks,
  ) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
    this.setupTouchButtons();
    document
      .getElementById("touchPause")
      ?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.callbacks.onPause();
      });
    document
      .getElementById("touchRestart")
      ?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.callbacks.onRestart();
      });
    document.getElementById("cta")?.addEventListener("click", (event) => {
      event.preventDefault();
      const mode = this.callbacks.getMode();
      if (mode === "ready" || mode === "gameover") this.callbacks.onStart();
      else if (mode === "paused") this.callbacks.onPause();
    });
  }

  getInput(): ChickenHopInput {
    return {
      down:
        this.touchState.down ||
        this.keys.has("ArrowDown") ||
        this.keys.has("s") ||
        this.keys.has("S"),
      jump:
        this.touchState.jump ||
        this.keys.has(" ") ||
        this.keys.has("ArrowUp") ||
        this.keys.has("w") ||
        this.keys.has("W"),
      left:
        this.touchState.left ||
        this.keys.has("ArrowLeft") ||
        this.keys.has("a") ||
        this.keys.has("A"),
      right:
        this.touchState.right ||
        this.keys.has("ArrowRight") ||
        this.keys.has("d") ||
        this.keys.has("D"),
    };
  }

  clear = () => {
    this.keys.clear();
    for (const action of Object.keys(this.touchState) as TouchAction[]) {
      this.touchState[action] = false;
      this.touchCounts[action] = 0;
    }
    this.touchPointers.clear();
    this.syncTouchVisuals();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
    const controlledKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      " ",
      "Enter",
      "p",
      "P",
      "r",
      "R",
      "1",
      "2",
      "3",
      "a",
      "A",
      "d",
      "D",
      "w",
      "W",
      "s",
      "S",
    ];
    if (!typing && controlledKeys.includes(event.key)) event.preventDefault();
    if (!typing) this.keys.add(event.key);

    const mode = this.callbacks.getMode();
    if (event.key === "Enter" && (mode === "ready" || mode === "gameover")) {
      this.callbacks.onStart();
    }
    if (!typing && event.key === "1") this.callbacks.onTimeMode("slow");
    else if (!typing && event.key === "2") this.callbacks.onTimeMode("normal");
    else if (!typing && event.key === "3") this.callbacks.onTimeMode("fast");
    else if (!typing && (event.key === "p" || event.key === "P")) {
      this.callbacks.onPause();
    } else if (!typing && (event.key === "r" || event.key === "R")) {
      this.callbacks.onRestart();
    }
    if (mode !== "ready") this.callbacks.ensureAudio();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key);
  };

  private setupTouchButtons() {
    if (!this.touchMode) return;
    for (const button of this.touchButtons) {
      button.addEventListener("pointerdown", (event) => {
        const action = button.dataset.touch as TouchAction | undefined;
        if (!action || !(action in this.touchState)) return;
        event.preventDefault();
        this.setTouchAction(action, event.pointerId, true);
        button.setPointerCapture?.(event.pointerId);
        if (this.callbacks.getMode() !== "ready") this.callbacks.ensureAudio();
      });
      const release = (event: PointerEvent) =>
        this.releaseTouchPointer(event.pointerId);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    }
    window.addEventListener("pointerup", (event) =>
      this.releaseTouchPointer(event.pointerId),
    );
    window.addEventListener("pointercancel", (event) =>
      this.releaseTouchPointer(event.pointerId),
    );
  }

  private setTouchAction(
    action: TouchAction,
    pointerId: number,
    active: boolean,
  ) {
    const previous = this.touchPointers.get(pointerId);
    if (previous && previous !== action) {
      this.touchCounts[previous] = Math.max(0, this.touchCounts[previous] - 1);
      this.touchState[previous] = this.touchCounts[previous] > 0;
    }
    if (!active) {
      if (previous) {
        this.touchCounts[previous] = Math.max(0, this.touchCounts[previous] - 1);
        this.touchState[previous] = this.touchCounts[previous] > 0;
      }
      this.touchPointers.delete(pointerId);
      this.syncTouchVisuals();
      return;
    }
    if (previous === action) return;
    this.touchPointers.set(pointerId, action);
    this.touchCounts[action] += 1;
    this.touchState[action] = true;
    this.syncTouchVisuals();
  }

  private releaseTouchPointer(pointerId: number) {
    const action = this.touchPointers.get(pointerId);
    if (!action) return;
    this.setTouchAction(action, pointerId, false);
  }

  private syncTouchVisuals() {
    for (const button of this.touchButtons) {
      const action = button.dataset.touch as TouchAction | undefined;
      if (!action || !(action in this.touchState)) continue;
      button.classList.toggle("active", this.touchState[action]);
    }
  }
}
