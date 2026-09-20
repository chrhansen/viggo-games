export class HullWarning {
  constructor() {
    this.context = null;
    this.nextBeep = 0;
  }

  unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      this.context ??= new AudioContext();
      this.context.resume().catch(() => {});
      this.nextBeep = 0;
    } catch {
      // The visual warning remains available when audio is blocked.
    }
  }

  update(active) {
    const context = this.context;
    if (!active || !context || context.state !== "running") {
      this.nextBeep = 0;
      return;
    }
    const now = context.currentTime;
    if (now < this.nextBeep) return;
    this.nextBeep = now + 1;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
    gain.gain.linearRampToValueAtTime(0, now + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }
}
