import { emptyBurbInput, type BurbInput } from '../../../../games/burb/core/engine';

export type BurbControl = Exclude<keyof BurbInput, 'tilt'>;

export function createBurbTouchInput() {
  const input = emptyBurbInput();
  const touches = new Map<string, BurbControl>();
  function sync() {
    Object.assign(input, emptyBurbInput());
    for (const control of touches.values()) input[control] = true;
  }
  return {
    input,
    hold(control: BurbControl, identifiers: string[]) {
      for (const id of identifiers) touches.set(id, control);
      sync();
    },
    release(identifiers: string[]) {
      for (const id of identifiers) touches.delete(id);
      sync();
    },
    reset() {
      touches.clear();
      sync();
    },
  };
}

export type BurbTouchInput = ReturnType<typeof createBurbTouchInput>;
