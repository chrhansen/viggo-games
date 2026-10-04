import { lookDelta } from 'hunter-guy/core';

export function nativeLookDelta(deltaX: number, deltaY: number) {
  return lookDelta(deltaX, -deltaY);
}
