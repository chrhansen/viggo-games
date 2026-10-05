import { describe, expect, it } from 'vitest';
import { getGravityRollAngle, mapTiltAngleToSteer, signedAngleDelta } from '../../games/burb/core/tilt-steering';
import { createBurbGame } from '../../games/burb/core/engine';
import { createBurbMotionInput } from '../../mobile/src/game/burb/motion-input';
import { createBurbTouchInput } from '../../mobile/src/game/burb/touch-input';

function sample(roll: number, orientation = 90, pitch = 0, acceleration = { x: 0, y: 0 }) {
  const angle = (orientation + roll) * Math.PI / 180;
  const gravity = 9.80665 * Math.cos(pitch * Math.PI / 180);
  return {
    orientation, acceleration,
    accelerationIncludingGravity: { x: Math.sin(angle) * gravity + acceleration.x, y: -Math.cos(angle) * gravity + acceleration.y },
  };
}
function controls() {
  const touch = createBurbTouchInput();
  const motion = createBurbMotionInput(touch);
  motion.setEnabled(true);
  return { touch, motion };
}

describe('Burb screen-axis roll steering', () => {
  it.each([90, -90])('steers right for clockwise roll and left for counterclockwise roll in landscape %s', orientation => {
    const { touch, motion } = controls();
    motion.sample(sample(0, orientation), 0);
    motion.sample(sample(10, orientation), 33); motion.apply(33);
    expect(touch.input.tilt).toBeCloseTo(0.5);
    motion.sample(sample(-10, orientation), 66); motion.apply(66);
    expect(touch.input.tilt).toBeCloseTo(-0.5);
    motion.sample(sample(30, orientation), 99); motion.apply(99);
    expect(touch.input.tilt).toBe(1);
    motion.sample(sample(-30, orientation), 132); motion.apply(132);
    expect(touch.input.tilt).toBe(-1);
  });

  it('uses a small dead zone and stable gravity rather than hand acceleration', () => {
    const { touch, motion } = controls();
    motion.sample(sample(0), 0);
    motion.sample(sample(1.5, 90, 0, { x: 7, y: -5 }), 33); motion.apply(33);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(10, 90, 0, { x: -3, y: 4 }), 66); motion.apply(66);
    expect(touch.input.tilt).toBeCloseTo(0.5);
  });

  it('ignores forward/backward pitch, clears flat-phone readings and recenters when upright again', () => {
    const { touch, motion } = controls();
    motion.sample(sample(0), 0);
    motion.sample(sample(0, 90, 35), 33); motion.apply(33);
    expect(touch.input.tilt).toBeCloseTo(0);
    motion.sample(sample(10, 90, 35), 66); motion.apply(66);
    expect(touch.input.tilt).toBeCloseTo(0.5);
    motion.sample(sample(10, 90, 85), 99); motion.apply(99);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(10), 132); motion.apply(132);
    expect(touch.input.tilt).toBe(0);
  });

  it('centers the starting hold and the Center tilt button without changing sensitivity', () => {
    const { touch, motion } = controls();
    motion.sample(sample(8), 0); motion.apply(0);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(18), 33); motion.apply(33);
    expect(touch.input.tilt).toBeCloseTo(0.5);
    motion.recenter(33); motion.apply(33);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(8), 66); motion.apply(66);
    expect(touch.input.tilt).toBeCloseTo(-0.5);
  });

  it('recenters when landscape flips and handles angles crossing 180 degrees', () => {
    const { touch, motion } = controls();
    motion.sample(sample(0), 0);
    motion.sample(sample(10), 33); motion.apply(33);
    motion.sample(sample(0, -90), 66); motion.apply(66);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(10, -90), 99); motion.apply(99);
    expect(touch.input.tilt).toBeCloseTo(0.5);
    expect(signedAngleDelta(-175, 175)).toBe(10);
  });

  it('stops stale or invalid motion input and calibrates the next fresh sample', () => {
    const { touch, motion } = controls();
    motion.sample(sample(0), 0);
    motion.sample(sample(10), 33); motion.apply(33);
    motion.apply(284);
    expect(touch.input.tilt).toBe(0);
    motion.sample(sample(10), 300); motion.apply(300);
    expect(touch.input.tilt).toBe(0);
    motion.sample({ ...sample(10), accelerationIncludingGravity: { x: NaN, y: 0 } }, 333); motion.apply(333);
    expect(touch.input.tilt).toBe(0);
    expect(getGravityRollAngle({ x: null, y: 1 })).toBeNull();
  });

  it('restores buttons in portrait/permission fallback and keeps speed touches independent of tilt', () => {
    const touch = createBurbTouchInput();
    const motion = createBurbMotionInput(touch);
    touch.hold('right', ['steer']); touch.hold('accelerate', ['speed']);
    motion.setEnabled(true);
    expect(touch.input.right).toBe(false);
    motion.sample(sample(0), 0); motion.sample(sample(10), 33); motion.apply(33);
    touch.release(['speed']); touch.hold('brake', ['slow']); touch.hold('left', ['ignored']);
    expect(touch.input.tilt).toBeCloseTo(0.5);
    expect(touch.input.left).toBe(false);
    expect(touch.input.brake).toBe(true);
    motion.setEnabled(false);
    motion.sample(sample(30), 66); motion.apply(66);
    expect(touch.input.tilt).toBe(0);
    touch.hold('left', ['steer']);
    expect(touch.input.left).toBe(true);
    expect(touch.input.brake).toBe(true);
    touch.reset();
    expect(Object.values(touch.input).every(value => !value)).toBe(true);
    motion.setEnabled(true); motion.sample(sample(-8), 100); motion.apply(100);
    expect(touch.input.tilt).toBe(0);
  });

  it('shares the browser tilt math and the same engine response for a motion timeline', () => {
    const { touch, motion } = controls();
    const phone = createBurbGame(); const browser = createBurbGame();
    const neutral = getGravityRollAngle(sample(0).accelerationIncludingGravity, 90)!;
    phone.setActive(true); browser.setActive(true);
    for (let frame = 0; frame < 180; frame++) {
      const measurement = sample(Math.sin(frame / 20) * 12);
      const time = frame * 1000 / 60;
      motion.sample(measurement, time); motion.apply(time);
      const roll = getGravityRollAngle(measurement.accelerationIncludingGravity, 90)!;
      const tilt = mapTiltAngleToSteer(signedAngleDelta(roll, neutral), 2, 18);
      phone.step(1 / 60, touch.input);
      browser.step(1 / 60, { ...touch.input, tilt });
      expect(phone.state.heading).toBeCloseTo(browser.state.heading, 10);
      expect(phone.state.position.x).toBeCloseTo(browser.state.position.x, 10);
    }
    expect(mapTiltAngleToSteer(20)).toBe(0.5);
  });
});
