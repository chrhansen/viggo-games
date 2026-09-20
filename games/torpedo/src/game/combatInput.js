const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const deadZone = (value, threshold = 0.08) => (Math.abs(value) < threshold ? 0 : value);

export class CombatInput {
  constructor() {
    this.touch = { x: 0, y: 0 };
    this.motion = {
      enabled: false,
      calibrated: false,
      neutralBeta: 0,
      neutralGamma: 0,
      x: 0,
      y: 0
    };
  }

  setTouch(x, y) {
    this.touch.x = clamp(x, -1, 1);
    this.touch.y = clamp(y, -1, 1);
  }

  clearTouch() {
    this.touch.x = 0;
    this.touch.y = 0;
  }

  setMotionControl(enabled) {
    this.motion.enabled = enabled;
    this.motion.calibrated = false;
    this.motion.x = 0;
    this.motion.y = 0;
  }

  handleDeviceOrientation(event) {
    if (!this.motion.enabled || event.beta == null || event.gamma == null) return false;

    const beta = Number(event.beta);
    const gamma = Number(event.gamma);
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return false;

    if (!this.motion.calibrated) {
      this.motion.neutralBeta = beta;
      this.motion.neutralGamma = gamma;
      this.motion.calibrated = true;
    }

    this.motion.x = deadZone(clamp((this.motion.neutralGamma - gamma) / 18, -1, 1));
    this.motion.y = deadZone(clamp((beta - this.motion.neutralBeta) / 18, -1, 1));
    return true;
  }

  vector() {
    return {
      x: clamp(this.touch.x + this.motion.x, -1, 1),
      y: clamp(this.touch.y + this.motion.y, -1, 1)
    };
  }
}
