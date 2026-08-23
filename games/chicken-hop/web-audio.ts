import type { ChickenHopEvent } from "@viggo-games/chicken-hop-core";

type AudioContextConstructor = typeof AudioContext;

const AudioContextClass =
  window.AudioContext ??
  (window as unknown as { webkitAudioContext?: AudioContextConstructor })
    .webkitAudioContext;

export class ChickenHopAudio {
  private context: AudioContext | null = null;
  private resumePromise: Promise<void> | null = null;

  ensure() {
    try {
      if (!this.context && AudioContextClass) {
        this.context = new AudioContextClass();
      }
      if (this.context?.state === "suspended" && !this.resumePromise) {
        this.resumePromise = this.context
          .resume()
          .catch(() => undefined)
          .finally(() => {
            this.resumePromise = null;
          });
      }
      return this.context?.state === "running";
    } catch {
      return false;
    }
  }

  handle(events: ChickenHopEvent[]) {
    for (const event of events) {
      if (event.type === "start") this.start();
      else if (event.type === "jump") this.jump();
      else if (event.type === "land") this.land();
      else if (event.type === "corn") this.corn();
      else if (event.type === "hurt") this.ouch();
      else if (event.type === "egg") this.egg();
      else if (event.type === "gameover") this.bonk();
      else if (event.type === "cluck-fast") this.cluckFast();
      else if (event.type === "cluck-slow") this.cluckSlow();
    }
  }

  private runWhenReady(effect: (context: AudioContext) => void) {
    if (!this.context) return;
    if (this.context.state === "running") {
      effect(this.context);
      return;
    }
    this.ensure();
    if (this.context.state === "running") {
      effect(this.context);
      return;
    }
    this.resumePromise?.then(() => {
      if (this.context?.state === "running") effect(this.context);
    });
  }

  private beep({
    bend = 0,
    duration = 0.08,
    frequency = 440,
    gain = 0.06,
    type = "square",
  }: {
    bend?: number;
    duration?: number;
    frequency?: number;
    gain?: number;
    type?: OscillatorType;
  }) {
    this.runWhenReady((context) => {
      const startsAt = context.currentTime + 0.01;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      if (bend !== 0) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(40, frequency + bend),
          startsAt + duration,
        );
      }
      volume.gain.setValueAtTime(0.0001, startsAt);
      volume.gain.exponentialRampToValueAtTime(gain, startsAt + 0.01);
      volume.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
      oscillator.connect(volume);
      volume.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + duration + 0.02);
    });
  }

  private noisePop(duration = 0.08, gain = 0.05) {
    this.runWhenReady((context) => {
      const length = Math.floor(context.sampleRate * duration);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        const progress = index / length;
        data[index] =
          (Math.random() * 2 - 1) * (1 - progress) * (1 - progress);
      }
      const source = context.createBufferSource();
      const volume = context.createGain();
      volume.gain.setValueAtTime(gain, context.currentTime + 0.01);
      source.buffer = buffer;
      source.connect(volume);
      volume.connect(context.destination);
      source.start(context.currentTime + 0.01);
    });
  }

  private jump() {
    this.beep({ frequency: 520, duration: 0.07, gain: 0.05, bend: 160 });
  }

  private land() {
    this.beep({ frequency: 180, duration: 0.06, type: "triangle", gain: 0.04, bend: -40 });
  }

  private corn() {
    this.beep({ frequency: 880, duration: 0.06, type: "sine", gain: 0.05, bend: 200 });
  }

  private ouch() {
    this.beep({ frequency: 240, duration: 0.08, gain: 0.04, bend: -80 });
  }

  private egg() {
    this.noisePop(0.06, 0.03);
    this.beep({ frequency: 160, duration: 0.06, type: "triangle", gain: 0.025, bend: -20 });
  }

  private cluckFast() {
    this.beep({ frequency: 420 + Math.random() * 100, duration: 0.05, gain: 0.028, bend: 120 });
  }

  private cluckSlow() {
    this.beep({ frequency: 280 + Math.random() * 80, duration: 0.06, type: "triangle", gain: 0.03, bend: 40 });
  }

  private bonk() {
    this.noisePop(0.1, 0.07);
    this.beep({ frequency: 90, duration: 0.1, type: "sawtooth", gain: 0.03, bend: -10 });
  }

  private start() {
    this.beep({ frequency: 330, duration: 0.08, gain: 0.04, bend: 240 });
  }
}
