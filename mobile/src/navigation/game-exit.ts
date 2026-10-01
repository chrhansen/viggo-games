interface GameExitOptions {
  pause: () => () => void;
  confirm: (cancel: () => void, exit: () => void) => void;
  leave: () => void;
}

export function createGameExitRequest() {
  let pending = false;
  return ({ pause, confirm, leave }: GameExitOptions) => {
    if (pending) return;
    pending = true;
    let settled = false;
    const resume = pause();
    confirm(() => {
      if (settled) return;
      settled = true;
      pending = false;
      resume();
    }, () => {
      if (settled) return;
      settled = true;
      pending = false;
      leave();
    });
  };
}
