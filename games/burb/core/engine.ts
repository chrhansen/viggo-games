import { createRideCollisions, type Obstacle, type Point2 } from './collisions';

export type BurbInput = {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  tilt: number;
};
export type BurbPosition = Point2 & { y: number };
export type BurbOptions = {
  position?: BurbPosition;
  heading?: number;
  colliders?: Obstacle[];
  surfaceHeight?: (position: BurbPosition) => number;
};

export const emptyBurbInput = (): BurbInput => ({
  accelerate: false, brake: false, left: false, right: false, tilt: 0,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const damp = (value: number, target: number, rate: number, delta: number) =>
  target + (value - target) * Math.exp(-rate * delta);
const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export function createBurbGame(options: BurbOptions = {}) {
  const collisions = createRideCollisions(options.colliders ?? []);
  const state = {
    active: false,
    elapsed: 0,
    speed: 12,
    heading: options.heading ?? 0,
    roll: 0,
    steer: 0,
    tiltSteer: 0,
    fov: 74,
    position: { ...(options.position ?? { x: 0, y: 0, z: 0 }) },
  };
  return {
    state,
    setActive(active: boolean) {
      state.active = active;
      if (!active) state.tiltSteer = 0;
    },
    step(frameDelta: number, input: BurbInput) {
      if (!state.active || !Number.isFinite(frameDelta) || frameDelta <= 0) return;
      const delta = Math.min(frameDelta, 0.05);
      state.elapsed += delta;
      state.tiltSteer = damp(state.tiltSteer, clamp(input.tilt, -1, 1), 9, delta);
      const buttonSteer = Number(input.right) - Number(input.left);
      const steer = buttonSteer !== 0 ? buttonSteer : state.tiltSteer;
      const throttle = Number(input.accelerate) - Number(input.brake);
      state.steer = damp(state.steer, steer, 6.5, delta);
      state.speed = damp(state.speed, clamp(12 + throttle * 6.5, 5, 20), 3.6, delta);
      state.heading = modulo(state.heading - state.steer * 1.55 * delta, Math.PI * 2);
      state.roll = damp(state.roll, clamp(-state.steer * 0.08, -0.1, 0.1), 7.2, delta);
      const movement = collisions.move(
        state.position,
        Math.sin(state.heading) * state.speed * delta,
        Math.cos(state.heading) * state.speed * delta,
      );
      if (movement.collided) state.speed = Math.min(state.speed, movement.distance / delta);
      state.position.y = options.surfaceHeight?.(state.position) ?? state.position.y;
      state.fov = damp(state.fov, 74 + (state.speed - 12) * 0.75, 3.2, delta);
    },
  };
}

export type BurbGame = ReturnType<typeof createBurbGame>;
