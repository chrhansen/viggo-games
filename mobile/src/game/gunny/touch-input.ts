import { emptyGunnyInput, type GunnyInput } from '../../../../games/gunny/core/engine.js';

export type GunnyControl = keyof GunnyInput;
export function createGunnyTouchInput() {
  const input = emptyGunnyInput();
  const touches = new Map<string, GunnyControl>();
  function sync() {
    for (const control of Object.keys(input) as GunnyControl[]) input[control] = false;
    for (const control of touches.values()) input[control] = true;
  }
  return {
    input,
    hold(control: GunnyControl, ids: string[]) { for (const id of ids) touches.set(id, control); sync(); },
    release(ids: string[]) { for (const id of ids) touches.delete(id); sync(); },
    reset() { touches.clear(); sync(); },
  };
}
export type GunnyTouchInput = ReturnType<typeof createGunnyTouchInput>;
