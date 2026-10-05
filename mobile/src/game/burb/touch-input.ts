import { emptyBurbInput, type BurbInput } from '../../../../games/burb/core/engine';

export type BurbControl = Exclude<keyof BurbInput, 'tilt'>;

export function createBurbTouchInput() {
  const input = emptyBurbInput();
  const touches = new Map<string, BurbControl>();
  let steeringMode: 'buttons' | 'tilt' = 'buttons';
  function sync() {
    input.accelerate = input.brake = input.left = input.right = false;
    for (const control of touches.values()) input[control] = true;
  }
  return {
    input,
    hold(control: BurbControl, identifiers: string[]) {
      if (steeringMode === 'tilt' && (control === 'left' || control === 'right')) return;
      for (const id of identifiers) touches.set(id, control);
      sync();
    },
    release(identifiers: string[]) {
      for (const id of identifiers) touches.delete(id);
      sync();
    },
    reset() {
      touches.clear();
      input.tilt = 0;
      sync();
    },
    setSteeringMode(mode: typeof steeringMode) {
      steeringMode = mode;
      if (mode === 'tilt') {
        for (const [id, control] of touches) if (control === 'left' || control === 'right') touches.delete(id);
      } else input.tilt = 0;
      sync();
    },
    setTilt(value: number) {
      input.tilt = steeringMode === 'tilt' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
    },
  };
}

export type BurbTouchInput = ReturnType<typeof createBurbTouchInput>;
