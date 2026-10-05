import { getGravityRollAngle, signedAngleDelta, mapTiltAngleToSteer } from '../../../../games/burb/core/tilt-steering';
import type { BurbTouchInput } from './touch-input';

type MotionSample = {
  accelerationIncludingGravity: { x: number; y: number };
  acceleration: { x: number; y: number } | null;
  orientation: number;
};
const SAMPLE_TIMEOUT_MS = 250;

export function createBurbMotionInput(touch: BurbTouchInput) {
  let enabled = false;
  let orientation: number | null = null;
  let neutralAngle: number | null = null;
  let currentAngle: number | null = null;
  let sampledAt: number | null = null;
  let target = 0;
  function reset() {
    orientation = neutralAngle = currentAngle = sampledAt = null;
    target = 0;
    touch.setTilt(0);
  }
  return {
    setEnabled(value: boolean) {
      enabled = value;
      reset();
      touch.setSteeringMode(value ? 'tilt' : 'buttons');
    },
    sample(sample: MotionSample, now: number) {
      if (!enabled || !Number.isFinite(now)) return;
      if (sample.orientation !== orientation) reset();
      orientation = sample.orientation;
      const gravity = {
        x: sample.accelerationIncludingGravity.x - (sample.acceleration?.x ?? 0),
        y: sample.accelerationIncludingGravity.y - (sample.acceleration?.y ?? 0),
      };
      const angle = getGravityRollAngle(gravity);
      if (angle === null) { reset(); return; }
      currentAngle = angle;
      neutralAngle ??= angle;
      sampledAt = now;
      target = mapTiltAngleToSteer(signedAngleDelta(angle, neutralAngle), 2, 18);
    },
    apply(now: number) {
      const fresh = sampledAt !== null && now >= sampledAt && now - sampledAt <= SAMPLE_TIMEOUT_MS;
      if (!fresh) reset();
      touch.setTilt(enabled && fresh ? target : 0);
    },
    recenter(now: number) {
      if (sampledAt === null || now - sampledAt > SAMPLE_TIMEOUT_MS) reset();
      else { neutralAngle = currentAngle; target = 0; touch.setTilt(0); }
    },
  };
}
