import type { TorpedoGame } from '../../../../games/torpedo/src/game/TorpedoGame.js';

export type TorpedoControl = 'left' | 'right' | 'up' | 'down' | 'fire' | 'turnLeft' | 'turnRight';
export function createTorpedoTouchInput() {
  const touches = new Map<string, TorpedoControl>();
  const held = (control: TorpedoControl) => [...touches.values()].includes(control);
  return {
    held,
    hold(control: TorpedoControl, ids: string[]) { for (const id of ids) touches.set(id, control); },
    release(ids: string[]) { for (const id of ids) touches.delete(id); },
    reset() { touches.clear(); },
    apply(game: TorpedoGame) {
      game.setTouchInput(Number(held('right')) - Number(held('left')), Number(held('up')) - Number(held('down')));
      for (const [control, key] of [['turnLeft', 'KeyQ'], ['turnRight', 'KeyE']] as const) {
        if (held(control)) game.keys.add(key); else game.keys.delete(key);
      }
      if (held('fire')) game.firePlayerTorpedo();
    },
  };
}
export type TorpedoTouchInput = ReturnType<typeof createTorpedoTouchInput>;
